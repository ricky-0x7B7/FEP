"""
KUTTIAPP - Translation Service
Servizio di traduzione multilingua per contenuti dinamici

Supporta:
- Rilevamento automatico lingua sorgente
- Traduzione Tamil <-> Italian <-> English
- Cache intelligente delle traduzioni
- Fallback graceful per errori

Target Fields:
- news.title, news.content
- missions.description
"""

from deep_translator import GoogleTranslator
import sqlite3
import logging
from datetime import datetime
from typing import Optional, Dict, List, Tuple

# Configurazione logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TranslationService:
    """
    Servizio di traduzione riusabile e DRY per KUTTIAPP
    """
    
    # Lingue supportate
    SUPPORTED_LANGUAGES = {
        'en': 'english',
        'it': 'italian', 
        'ta': 'tamil'
    }
    
    # Mappatura campi supportati
    SUPPORTED_FIELDS = {
        'news': ['title', 'content'],
        'mission': ['description'],
        'children': ['name', 'description'],
        'user': ['bio']
    }
    
    def __init__(self, db_path: str = 'kuttiapp.db'):
        """
        Inizializza il servizio di traduzione
        
        Args:
            db_path: Percorso al database SQLite
        """
        self.db_path = db_path
        self.translator = GoogleTranslator()
        
        # Crea tabella translations se non esiste
        self._ensure_translations_table()
        
        logger.info("TranslationService inizializzato")
    
    def _ensure_translations_table(self):
        """
        Crea la tabella translations se non esiste
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS translations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    entity_type TEXT NOT NULL,
                    entity_id INTEGER NOT NULL,
                    field_name TEXT NOT NULL,
                    language TEXT NOT NULL,
                    translated_text TEXT NOT NULL,
                    source_language TEXT,
                    is_original BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(entity_type, entity_id, field_name, language)
                )
            ''')
            
            # Indici per performance
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_translations_lookup 
                ON translations(entity_type, entity_id, field_name, language)
            ''')
            
            conn.commit()
            conn.close()
            
            logger.info("Tabella translations verificata/creata")
            
        except Exception as e:
            logger.error(f"Errore creazione tabella translations: {e}")
            raise
    
    def detect_language(self, text: str) -> str:
        """
        Rileva la lingua di un testo
        
        Args:
            text: Testo da analizzare
            
        Returns:
            Codice lingua (en/it/ta) o 'en' come fallback
        """
        if not text or not text.strip():
            return 'en'
        
        try:
            # Strategia semplificata: analizza caratteri per rilevare lingua
            # Tamil: caratteri Unicode nel range Tamil
            tamil_chars = sum(1 for char in text if '\u0b80' <= char <= '\u0bff')
            
            # Se più del 20% sono caratteri Tamil, è Tamil
            if tamil_chars > len(text) * 0.2:
                logger.info(f"Lingua rilevata: Tamil (caratteri Tamil: {tamil_chars}/{len(text)})")
                return 'ta'
            
            # Parole italiane comuni
            italian_words = ['il', 'la', 'di', 'da', 'in', 'con', 'per', 'che', 'non', 'una', 'uno', 'della', 'delle', 'dei', 'degli']
            text_lower = text.lower()
            italian_matches = sum(1 for word in italian_words if word in text_lower)
            
            # Se trova molte parole italiane, probabilmente è italiano
            if italian_matches >= 2:
                logger.info(f"Lingua rilevata: Italiano (parole comuni: {italian_matches})")
                return 'it'
            
            # Default: inglese
            logger.info(f"Lingua rilevata: Inglese (fallback)")
            return 'en'
            
        except Exception as e:
            logger.warning(f"Errore rilevamento lingua, fallback a 'en': {e}")
            return 'en'
    
    def translate_text(self, text: str, target_language: str, source_language: Optional[str] = None) -> str:
        """
        Traduce un testo nella lingua target
        
        Args:
            text: Testo da tradurre
            target_language: Lingua di destinazione (en/it/ta)
            source_language: Lingua sorgente (opzionale, auto-rilevata)
            
        Returns:
            Testo tradotto o originale in caso di errore
        """
        if not text or not text.strip():
            return text
        
        # Se lingua target non supportata, ritorna originale
        if target_language not in self.SUPPORTED_LANGUAGES:
            logger.warning(f"Lingua target non supportata: {target_language}")
            return text
        
        # Rileva lingua sorgente se non fornita
        if not source_language:
            source_language = self.detect_language(text)
        
        # Se sorgente = target, ritorna originale
        if source_language == target_language:
            return text
        
        try:
            # Traduzione usando deep-translator
            translator = GoogleTranslator(
                source=self.SUPPORTED_LANGUAGES[source_language],
                target=self.SUPPORTED_LANGUAGES[target_language]
            )
            
            translated = translator.translate(text.strip())
            
            logger.info(f"Traduzione {source_language}->{target_language}: '{text[:50]}...' -> '{translated[:50]}...'")
            return translated
            
        except Exception as e:
            logger.error(f"Errore traduzione {source_language}->{target_language}: {e}")
            return text  # Fallback all'originale
    
    def get_cached_translation(self, entity_type: str, entity_id: int, field_name: str, language: str) -> Optional[str]:
        """
        Recupera una traduzione dalla cache
        
        Args:
            entity_type: Tipo entità (news/missions)
            entity_id: ID dell'entità
            field_name: Nome del campo
            language: Lingua desiderata
            
        Returns:
            Testo tradotto o None se non trovato
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT translated_text, source_language 
                FROM translations 
                WHERE entity_type = ? AND entity_id = ? 
                AND field_name = ? AND language = ?
            ''', (entity_type, entity_id, field_name, language))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                logger.info(f"Traduzione trovata in cache: {entity_type}.{entity_id}.{field_name} -> {language}")
                return result[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Errore recupero cache: {e}")
            return None
    
    def save_translation(self, entity_type: str, entity_id: int, field_name: str, 
                        language: str, translated_text: str, source_language: str, 
                        is_original: bool = False):
        """
        Salva una traduzione nella cache
        
        Args:
            entity_type: Tipo entità (news/missions)
            entity_id: ID dell'entità
            field_name: Nome del campo
            language: Lingua della traduzione
            translated_text: Testo tradotto
            source_language: Lingua sorgente
            is_original: Se è il testo originale
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # INSERT OR REPLACE per aggiornare traduzioni esistenti
            cursor.execute('''
                INSERT OR REPLACE INTO translations 
                (entity_type, entity_id, field_name, language, translated_text, 
                 source_language, is_original, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (entity_type, entity_id, field_name, language, translated_text, 
                  source_language, is_original, datetime.now().isoformat()))
            
            conn.commit()
            conn.close()
            
            logger.info(f"Traduzione salvata: {entity_type}.{entity_id}.{field_name} -> {language}")
            
        except Exception as e:
            logger.error(f"Errore salvataggio traduzione: {e}")
    
    def get_field_translation(self, entity_type: str, entity_id: int, 
                            field_name: str, target_language: str, 
                            original_text: str, source_language: str = 'en') -> str:
        """
        Metodo principale: ottiene traduzione con cache intelligente
        
        Args:
            entity_type: Tipo entità (news/missions)
            entity_id: ID dell'entità  
            field_name: Nome del campo
            target_language: Lingua desiderata
            original_text: Testo originale
            source_language: Lingua sorgente (invece di auto-detection)
            
        Returns:
            Testo tradotto nella lingua target
        """
        # Verifica che il campo sia supportato
        if entity_type not in self.SUPPORTED_FIELDS:
            logger.warning(f"Tipo entità non supportato: {entity_type}")
            return original_text
        
        if field_name not in self.SUPPORTED_FIELDS[entity_type]:
            logger.warning(f"Campo non supportato: {entity_type}.{field_name}")
            return original_text
        
        # Prova a recuperare dalla cache
        cached_translation = self.get_cached_translation(
            entity_type, entity_id, field_name, target_language
        )
        
        if cached_translation:
            return cached_translation
        
        # Se non in cache, traduce e salva
        logger.info(f"Traduzione non in cache, generando: {entity_type}.{entity_id}.{field_name} -> {target_language}")
        
        # Usa lingua sorgente esplicita (invece di auto-detection)
        logger.info(f"Usando lingua sorgente esplicita: {source_language}")
        
        # Salva l'originale se non ancora salvato
        original_cached = self.get_cached_translation(
            entity_type, entity_id, field_name, source_language
        )
        
        if not original_cached:
            self.save_translation(
                entity_type, entity_id, field_name, source_language, 
                original_text, source_language, is_original=True
            )
        
        # Traduce nella lingua target
        translated_text = self.translate_text(original_text, target_language, source_language)
        
        # Salva in cache
        self.save_translation(
            entity_type, entity_id, field_name, target_language,
            translated_text, source_language, is_original=False
        )
        
        return translated_text
    
    def pre_translate_entity(self, entity_type: str, entity_id: int, data: Dict[str, str], source_language: str):
        """
        Pre-traduce tutti i campi supportati di un'entità all'inserimento
        
        Args:
            entity_type: Tipo entità (news/missions)
            entity_id: ID dell'entità
            data: Dizionario con i dati dell'entità
            source_language: Lingua sorgente (lingua UI quando creato il contenuto)
        """
        if entity_type not in self.SUPPORTED_FIELDS:
            return
        
        supported_fields = self.SUPPORTED_FIELDS[entity_type]
        
        for field_name in supported_fields:
            if field_name in data and data[field_name]:
                original_text = data[field_name]
                
                # Salva originale
                self.save_translation(
                    entity_type, entity_id, field_name, source_language,
                    original_text, source_language, is_original=True
                )
                
                # Pre-genera traduzioni per le altre lingue
                for target_lang in self.SUPPORTED_LANGUAGES.keys():
                    if target_lang != source_language:
                        translated = self.translate_text(original_text, target_lang, source_language)
                        self.save_translation(
                            entity_type, entity_id, field_name, target_lang,
                            translated, source_language, is_original=False
                        )
                
                logger.info(f"Pre-traduzione completata per {entity_type}.{entity_id}.{field_name}")
    
    def get_translation_stats(self) -> Dict:
        """
        Restituisce statistiche sulle traduzioni
        
        Returns:
            Dizionario con statistiche
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Conteggi per entità
            cursor.execute('''
                SELECT entity_type, COUNT(*) as count
                FROM translations 
                GROUP BY entity_type
            ''')
            
            entity_counts = dict(cursor.fetchall())
            
            # Conteggi per lingua
            cursor.execute('''
                SELECT language, COUNT(*) as count
                FROM translations 
                GROUP BY language
            ''')
            
            language_counts = dict(cursor.fetchall())
            
            # Totale traduzioni
            cursor.execute('SELECT COUNT(*) FROM translations')
            total_translations = cursor.fetchone()[0]
            
            conn.close()
            
            return {
                'total_translations': total_translations,
                'by_entity': entity_counts,
                'by_language': language_counts
            }
            
        except Exception as e:
            logger.error(f"Errore recupero statistiche: {e}")
            return {}


# Factory function per creare istanza singleton
_translation_service_instance = None

def get_translation_service(db_path: str = 'kuttiapp.db') -> TranslationService:
    """
    Factory function per ottenere istanza singleton del servizio di traduzione
    
    Args:
        db_path: Percorso al database
        
    Returns:
        Istanza TranslationService
    """
    global _translation_service_instance
    
    if _translation_service_instance is None:
        _translation_service_instance = TranslationService(db_path)
    
    return _translation_service_instance


# Funzioni di utilità per uso semplificato
def translate_field(entity_type: str, entity_id: int, field_name: str, 
                   target_language: str, original_text: str, source_language: str = 'en') -> str:
    """
    Funzione di utilità per tradurre un campo
    """
    service = get_translation_service()
    return service.get_field_translation(
        entity_type, entity_id, field_name, target_language, original_text, source_language
    )

def pre_translate_all_fields(entity_type: str, entity_id: int, data: Dict[str, str], source_language: str):
    """
    Funzione di utilità per pre-tradurre tutti i campi di un'entità
    """
    service = get_translation_service()
    return service.pre_translate_entity(entity_type, entity_id, data, source_language)
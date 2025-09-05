/**
 * KUTTIAPP - Hook per Traduzioni Automatiche
 * 
 * Hook riusabile per gestire traduzioni automatiche dei campi
 * Supporta: news.title, news.content, missions.description, children.name, children.description
 * 
 * Strategia:
 * - Lingua sorgente = lingua interfaccia utente (i18n.language)
 * - Traduzione automatica verso altre lingue
 * - Cache intelligente per performance
 * - Fallback graceful per errori
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { translateField } from '../utils/api';

/**
 * Hook per gestire la traduzione automatica di un campo
 * 
 * @param {string} entityType - Tipo entità ('news' | 'missions' | 'children')
 * @param {number} entityId - ID dell'entità
 * @param {string} fieldName - Nome del campo ('title' | 'content' | 'description')
 * @param {string} originalText - Testo originale
 * @param {boolean} enabled - Se abilitare la traduzione (default: true)
 * @returns {object} { translatedText, isLoading, error, sourceLanguage }
 */
export const useTranslatedField = (
  entityType, 
  entityId, 
  fieldName, 
  originalText, 
  enabled = true
) => {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sourceLanguage, setSourceLanguage] = useState(i18n.language);
  
  useEffect(() => {
    // Se traduzione disabilitata o dati mancanti, mostra originale
    if (!enabled || !entityType || !entityId || !fieldName || !originalText) {
      setTranslatedText(originalText);
      return;
    }
    
    // Funzione per ottenere traduzione dalla cache (no real-time translation)
    const fetchCachedTranslation = async () => {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 useTranslatedField: Fetching translation for:', {
        entityType,
        entityId,
        fieldName,
        targetLanguage: i18n.language,
        originalText: originalText?.substring(0, 50) + '...'
      });
      
      try {
        const response = await translateField({
          entity_type: entityType,
          entity_id: entityId,
          field_name: fieldName,
          target_language: i18n.language,
          original_text: originalText
        });
        
        console.log('✅ Translation API response:', response.data); // Debug log
        
        if (response.data && response.data.translated_text) {
          console.log('✅ Translation found:', response.data.translated_text?.substring(0, 50) + '...');
          setTranslatedText(response.data.translated_text);
        } else {
          // Fallback all'originale se traduzione non trovata in cache
          console.warn('⚠️ No translated_text in response:', response.data);
          setTranslatedText(originalText);
        }
      } catch (err) {
        console.warn(`❌ Traduzione in cache non trovata per ${entityType}.${fieldName}:`, err);
        setError(err.message || 'Cache miss');
        setTranslatedText(originalText); // Fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchCachedTranslation();
  }, [
    entityType, 
    entityId, 
    fieldName, 
    originalText, 
    i18n.language, 
    enabled
  ]);
  
  return {
    translatedText,
    isLoading,
    error,
    sourceLanguage
  };
};

/**
 * Hook semplificato per traduzioni in tempo reale (senza cache)
 * Utile per contenuti dinamici o anteprime
 * 
 * @param {string} text - Testo da tradurre
 * @param {string} targetLanguage - Lingua di destinazione (default: lingua interfaccia)
 * @param {string} sourceLanguage - Lingua sorgente (default: lingua interfaccia)
 * @returns {object} { translatedText, isLoading, error }
 */
export const useRealTimeTranslation = (
  text, 
  targetLanguage = null, 
  sourceLanguage = null
) => {
  const { i18n } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const actualTargetLang = targetLanguage || i18n.language;
  const actualSourceLang = sourceLanguage || i18n.language;
  
  useEffect(() => {
    // Se lingue uguali o testo vuoto, non tradurre
    if (!text || actualSourceLang === actualTargetLang) {
      setTranslatedText(text);
      return;
    }
    
    const translateText = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('http://127.0.0.1:5001/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            source_lang: actualSourceLang,
            target_lang: actualTargetLang
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setTranslatedText(data.translated_text || text);
        } else {
          throw new Error('Translation request failed');
        }
      } catch (err) {
        console.warn('Real-time translation failed:', err);
        setError(err.message);
        setTranslatedText(text); // Fallback
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce per evitare troppe richieste
    const timeoutId = setTimeout(translateText, 500);
    return () => clearTimeout(timeoutId);
    
  }, [text, actualTargetLang, actualSourceLang]);
  
  return {
    translatedText,
    isLoading,
    error
  };
};

/**
 * Hook per ottenere placeholder tradotti per i form
 * 
 * @param {string} fieldType - Tipo di campo ('title' | 'content' | 'description')
 * @returns {string} Placeholder tradotto
 */
export const useTranslatedPlaceholder = (fieldType) => {
  const { t, i18n } = useTranslation();
  
  const placeholders = {
    title: t('translation.placeholders.title', 'Write the title in your language, it will be translated automatically...'),
    content: t('translation.placeholders.content', 'Write the content in your language, it will be translated automatically...'),
    description: t('translation.placeholders.description', 'Write the description in your language, it will be translated automatically...')
  };
  
  return placeholders[fieldType] || t('translation.placeholders.default', 'Write in your language, automatic translation enabled...');
};

/**
 * Hook per stato generale delle traduzioni
 * Utile per mostrare indicatori di caricamento globali
 * 
 * @returns {object} { hasActiveTranslations, totalTranslations }
 */
export const useTranslationState = () => {
  const [activeTranslations, setActiveTranslations] = useState(new Set());
  
  const addTranslation = (id) => {
    setActiveTranslations(prev => new Set([...prev, id]));
  };
  
  const removeTranslation = (id) => {
    setActiveTranslations(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };
  
  return {
    hasActiveTranslations: activeTranslations.size > 0,
    totalTranslations: activeTranslations.size,
    addTranslation,
    removeTranslation
  };
};

export default useTranslatedField;
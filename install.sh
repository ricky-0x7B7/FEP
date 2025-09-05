#!/bin/bash

echo "Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Error: Failed to install frontend dependencies"
    exit 1
fi

echo "Setting up Python virtual environment..."
python -m venv venv

if [ $? -ne 0 ]; then
    echo "Error: Failed to create virtual environment"
    exit 1
fi

echo "Installing backend dependencies..."
source venv/bin/activate && cd backend && pip install -r requirements.txt

if [ $? -ne 0 ]; then
    echo "Error: Failed to install backend dependencies"
    exit 1
fi

echo "Setting up SQLite database..."
source venv/bin/activate && cd backend && python reset_db.py

if [ $? -ne 0 ]; then
    echo "Error: Failed to setup database"
    exit 1
fi

echo "Importing demo data..."
source venv/bin/activate && cd backend && python import_demo_data.py

if [ $? -ne 0 ]; then
    echo "Error: Failed to import demo data"
    exit 1
fi

echo "Installation complete with demo data!"
echo "You can now run: ./start.sh"
echo "Remember to activate virtual environment: source venv/bin/activate"

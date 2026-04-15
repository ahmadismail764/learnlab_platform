@echo off
echo "Creating virtual environment..."
python -m venv venv
echo "Activating virtual environment..."
call venv\Scripts\activate.bat
echo "Installing requirements..."
pip install -r requirements.txt
echo "Creating Django apps..."
python manage.py startapp core
python manage.py startapp curriculum
python manage.py startapp practice
python manage.py startapp analytics
echo "Setup complete!"

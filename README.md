# Adaptive Question Generator and Performance Analyzer

An intelligent system that generates adaptive questions based on student performance and analyzes their learning progress.

## Project Overview

This project consists of a full-stack application that:
- Generates adaptive questions based on subject, class level, and difficulty
- Analyzes student performance
- Provides real-time feedback through a web interface

## Project Structure

```
├── Backend/
│   ├── Question_generation/    # Question generation module
│   ├── Adaptive_Module/        # Adaptive learning algorithms
│   ├── main.py                 # FastAPI server
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── index.html             # Main web interface
│   ├── style.css              # Styling
│   └── script.js              # Frontend logic
```

## Features

- Real-time question generation using WebSocket
- Adaptive difficulty adjustment
- Support for multiple subjects and education boards
- Performance tracking and analysis
- Modern web interface

## Prerequisites

- Python 3.8+
- Node.js (for frontend development)
- Conda environment

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Adaptive-Question-Generator-and-Performance-Analyzer.git
cd Adaptive-Question-Generator-and-Performance-Analyzer
```

2. Set up the backend:
```bash
cd Backend
conda create -n adaptive python=3.8
conda activate adaptive
pip install -r requirements.txt
```

3. Start the backend server:
```bash
python main.py
```

4. Open the frontend:
- Open `frontend/index.html` in your web browser
- Or serve it using a local web server

## API Documentation

### WebSocket Endpoint: `/generate_mcq`

Generates multiple-choice questions based on specified parameters.

Request Format:
```json
{
    "subject": "string",
    "class_level": "string",
    "board": "string",
    "difficulty": number
}
```

Response Format:
```json
{
    "question": "string",
    "options": ["string"],
    "correct_answer": "string",
    "explanation": "string"
}
```

## Environment Variables

Create a `.env` file in the Backend directory with the following variables:
```
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any queries or support, please open an issue in the repository.
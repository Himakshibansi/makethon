import os
import random
import math
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key_skill_sphere'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)
CORS(app)  # Enable CORS for all routes

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    firstName = db.Column(db.String(120), nullable=False)
    lastName = db.Column(db.String(120), nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Initialize Database
with app.app_context():
    db.create_all()

# ════════════════════════════════════════════════════════
# AUTHENTICATION ENDPOINTS
# ════════════════════════════════════════════════════════

@app.route('/api/signin', methods=['POST'])
def signin():
    """Handle user sign in"""
    try:
        data = request.get_json()
        email = data.get('email', '').strip()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = User.query.filter_by(email=email).first()

        if not user:
            return jsonify({
                "error": "Email not found. Please sign up first."
            }), 404

        if check_password_hash(user.password_hash, password):
            return jsonify({
                "status": "success",
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "name": f"{user.firstName} {user.lastName}".strip(),
                    "firstName": user.firstName,
                    "role": user.role
                }
            }), 200
        else:
            return jsonify({
                "error": "Incorrect password. Please try again."
            }), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/signup', methods=['POST'])
def signup():
    """Handle user sign up"""
    try:
        data = request.get_json()
        firstName = data.get('firstName', '').strip()
        lastName = data.get('lastName', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        role = data.get('role', 'student')

        if not firstName or not email or not password:
            return jsonify({"error": "First name, email, and password are required"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "User already exists with this email"}), 400

        hashed_pw = generate_password_hash(password)
        new_user = User(
            firstName=firstName,
            lastName=lastName,
            email=email,
            password_hash=hashed_pw,
            role=role
        )
        
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "status": "success",
            "user": {
                "id": new_user.id,
                "email": new_user.email,
                "name": f"{new_user.firstName} {new_user.lastName}".strip(),
                "firstName": new_user.firstName,
                "role": new_user.role
            }
        }), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ════════════════════════════════════════════════════════
# ASSESSMENT ENDPOINTS
# ════════════════════════════════════════════════════════

@app.route('/api/parse-skills', methods=['POST'])
def parse_skills():
    """Parse user skills from history and skills input"""
    try:
        data = request.get_json()
        history = data.get('history', '')
        skills_input = data.get('skills', '')
        
        # Simple skill extraction - in production, use NLP/AI
        skills_list = []
        combined = (history + ' ' + skills_input).lower()
        
        common_technical_skills = [
            'python', 'javascript', 'java', 'c++', 'sql', 'react', 'node.js',
            'machine learning', 'ai', 'data science', 'web development',
            'cloud computing', 'aws', 'azure', 'docker', 'kubernetes',
            'git', 'linux', 'html', 'css', 'typescript', 'golang', 'rust',
            'tensorflow', 'pytorch', 'pandas', 'numpy', 'flask', 'django'
        ]
        
        for skill in common_technical_skills:
            if skill in combined and skill not in [s['name'] for s in skills_list]:
                skills_list.append({
                    'name': skill.upper(),
                    'badge': random.choice(['blue', 'teal', 'amber'])
                })
        
        # Add manual skills if provided
        manual_skills = [s.strip() for s in skills_input.split(',') if s.strip()]
        for skill in manual_skills:
            if skill.lower() not in [s['name'].lower() for s in skills_list]:
                skills_list.append({
                    'name': skill.title(),
                    'badge': random.choice(['blue', 'teal', 'amber'])
                })
        
        return jsonify({
            "status": "success",
            "skills": skills_list[:10]  # Limit to 10 skills
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/entropy-analysis', methods=['POST'])
def entropy_analysis():
    """Analyze skill entropy and generate career score"""
    try:
        data = request.get_json()
        profile = data.get('profile', {})
        
        # Simulate entropy analysis
        entropy_data = []
        skills = profile.get('skills', 'python,javascript,web development').split(',')
        
        for i, skill in enumerate(skills[:5]):
            skill = skill.strip().title()
            if skill:
                entropy_data.append({
                    'skill': skill,
                    'score': random.randint(40, 95),
                    'status': random.choice(['Stable', 'Monitor', 'At Risk'])
                })
        
        # Calculate career score based on entropy
        career_score = random.randint(65, 95)
        entropy_level = 'Low' if career_score > 80 else 'Med' if career_score > 60 else 'High'
        
        return jsonify({
            "status": "success",
            "entropy": entropy_data,
            "careerScore": career_score,
            "entropyLevel": entropy_level
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/career-recommend', methods=['POST'])
def career_recommend():
    """Recommend careers based on profile"""
    try:
        data = request.get_json()
        profile = data.get('profile', {})
        
        # Simulated career recommendations
        career_recommendations = [
            {
                'icon': '💻',
                'title': 'Full Stack Developer',
                'desc': 'Build end-to-end web applications with modern frameworks',
                'tag': 'High Demand',
                'tagStyle': 'background:#14B8A6;color:white;'
            },
            {
                'icon': '🤖',
                'title': 'AI/ML Engineer',
                'desc': 'Develop intelligent systems and predictive models',
                'tag': 'Emerging',
                'tagStyle': 'background:#8B5CF6;color:white;'
            },
            {
                'icon': '☁️',
                'title': 'Cloud Architect',
                'desc': 'Design scalable cloud infrastructure solutions',
                'tag': 'Enterprise',
                'tagStyle': 'background:#F59E0B;color:white;'
            },
            {
                'icon': '🔐',
                'title': 'Cybersecurity Specialist',
                'desc': 'Protect systems and data from security threats',
                'tag': 'Critical',
                'tagStyle': 'background:#EF4444;color:white;'
            }
        ]
        
        return jsonify({
            "status": "success",
            "careers": career_recommendations[:3]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scholarship-match', methods=['POST'])
def scholarship_match():
    """Match scholarships based on profile"""
    try:
        data = request.get_json()
        profile = data.get('profile', {})
        
        # Simulated scholarship matches
        scholarships = [
            {
                'name': 'Google Cloud Skills Scholarship',
                'tags': [
                    {'label': 'Tech', 'style': 'background:#4F46E5;color:white;'},
                    {'label': '₹5L', 'style': 'background:#14B8A6;color:white;'}
                ],
                'applyUrl': 'https://cloud.google.com/training/scholarships'
            },
            {
                'name': 'AWS Educate Scholarship Program',
                'tags': [
                    {'label': 'Cloud', 'style': 'background:#F59E0B;color:white;'},
                    {'label': '₹10L', 'style': 'background:#14B8A6;color:white;'}
                ],
                'applyUrl': 'https://aws.amazon.com/education/awseducate/'
            },
            {
                'name': 'Microsoft Imagine Academy',
                'tags': [
                    {'label': 'Software', 'style': 'background:#0EA5E9;color:white;'},
                    {'label': '₹8L', 'style': 'background:#14B8A6;color:white;'}
                ],
                'applyUrl': 'https://www.microsoft.com/en-in/education/imagine-academy'
            }
        ]
        
        return jsonify({
            "status": "success",
            "scholarships": scholarships
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/counselor-match', methods=['POST'])
def counselor_match():
    """Find and match counselors based on location"""
    try:
        data = request.get_json()
        geo = data.get('geo')
        city = data.get('city', 'Unknown')
        state = data.get('state', 'Unknown')
        
        # Simulated counselor data
        counselors_base = [
            {'name': 'Dr. Rajesh Kumar', 'title': 'Career Counselor', 'exp': '8 years', 'initials': 'RK'},
            {'name': 'Priya Sharma', 'title': 'Academic Advisor', 'exp': '6 years', 'initials': 'PS'},
            {'name': 'Amit Patel', 'title': 'Tech Career Mentor', 'exp': '10 years', 'initials': 'AP'},
            {'name': 'Neha Singh', 'title': 'Entrepreneurship Coach', 'exp': '7 years', 'initials': 'NS'},
        ]
        
        # Generate pseudo-realistic distance
        counselors = []
        for counsel in counselors_base:
            dist = random.uniform(0.5, 15.0)
            counselors.append({
                'name': counsel['name'],
                'title': counsel['title'],
                'exp': counsel['exp'],
                'initials': counsel['initials'],
                'distKm': dist,
                'city': city
            })
        
        # Sort by distance
        counselors.sort(key=lambda x: x['distKm'])
        
        return jsonify({
            "status": "success",
            "counselors": counselors[:3]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "message": "Backend is running"}), 200

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)
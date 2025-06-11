import React, { useState } from 'react';
import { loginUser, registerUser } from '../utils/api';

interface AuthProps {
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    onLoginSuccess: (userData: any) => void;
}

const Auth: React.FC<AuthProps> = ({ setIsAuthenticated, onLoginSuccess }) => {
    const [showLogin, setShowLogin] = useState<boolean>(true);
    const [loginUsername, setLoginUsername] = useState<string>('');
    const [loginPassword, setLoginPassword] = useState<string>('');
    const [registerUsername, setRegisterUsername] = useState<string>('');
    const [registerPassword, setRegisterPassword] = useState<string>('');
    const [registerEmail, setRegisterEmail] = useState<string>('');
    const [registerSchool, setRegisterSchool] = useState<string>('');
    const [registerPhoneNumber, setRegisterPhoneNumber] = useState<string>('');
    const [registerBoard, setRegisterBoard] = useState<string>('');
    const [registerClass, setRegisterClass] = useState<string>('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

    const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
        setMessage({ text, type });
        setTimeout(() => {
            setMessage(null);
        }, 3000);
    };

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        const response = await loginUser(loginUsername, loginPassword);
        if (response.success) {
            localStorage.setItem('accessToken', response.token);
            setIsAuthenticated(true);
            if (response.user) {
                onLoginSuccess(response.user);
            }
            showMessage('Login successful!', 'success');
        } else {
            showMessage(response.message || 'Login failed.', 'error');
        }
    };

    const handleRegister = async (event: React.FormEvent) => {
        event.preventDefault();
        const userData = {
            username: registerUsername,
            password: registerPassword,
            email: registerEmail,
            school: registerSchool,
            phone_number: registerPhoneNumber,
            board: registerBoard,
            class_name: parseInt(registerClass, 10),
        };
        const response = await registerUser(userData);
        if (response.success) {
            showMessage('Registration successful! Please login.', 'success');
            setShowLogin(true);
            setRegisterUsername('');
            setRegisterPassword('');
            setRegisterEmail('');
            setRegisterSchool('');
            setRegisterPhoneNumber('');
            setRegisterBoard('');
            setRegisterClass('');
        } else {
            showMessage(response.message || 'Registration failed.', 'error');
        }
    };

    const availableClasses = Array.from({length: 10}, (_, i) => i + 1);

    return (
        <div id="auth-section" className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                {showLogin ? 'Login' : 'Register'}
            </h2>
            
            <div className="flex justify-center mb-6">
                <button 
                    onClick={() => {
                        setShowLogin(true);
                        setMessage(null);
                    }}
                    className={`${showLogin ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'} px-6 py-2 rounded-lg mr-2`}
                >
                    Login
                </button>
                <button 
                    onClick={() => {
                        setShowLogin(false);
                        setMessage(null);
                    }}
                    className={`${!showLogin ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-700'} px-6 py-2 rounded-lg`}
                >
                    Register
                </button>
            </div>

            {message && (
                <div className={`message-box show ${message.type === 'success' ? 'bg-green-500' : message.type === 'error' ? 'bg-red-500' : 'bg-indigo-500'}`}>
                    {message.text}
                </div>
            )}

            {/* Login Form */}
            {showLogin && (
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label htmlFor="login-username" className="block text-gray-700 text-lg font-semibold mb-2">Email/PhoneNumber:</label>
                        <input type="text" id="login-username" placeholder="Enter your email or phone number" required
                               value={loginUsername}
                               onChange={(e) => setLoginUsername(e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" />
                    </div>
                    <div>
                        <label htmlFor="login-password" className="block text-gray-700 text-lg font-semibold mb-2">Password:</label>
                        <input type="password" id="login-password" placeholder="Enter your password" required
                               value={loginPassword}
                               onChange={(e) => setLoginPassword(e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" />
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg">
                        Login
                    </button>
                </form>
            )}

            {/* Registration Form */}
            {!showLogin && (
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label htmlFor="register-username" className="block text-gray-700 text-lg font-semibold mb-2">Username:</label>
                        <input type="text" id="register-username" placeholder="Choose a username" required
                               value={registerUsername}
                               onChange={(e) => setRegisterUsername(e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" />
                    </div>
                    <div>
                        <label htmlFor="register-password" className="block text-gray-700 text-lg font-semibold mb-2">Password:</label>
                        <input type="password" id="register-password" placeholder="Create a password" required
                               value={registerPassword}
                               onChange={(e) => setRegisterPassword(e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" />
                    </div>
                    <div>
                        <label htmlFor="register-email" className="block text-gray-700 text-lg font-semibold mb-2">Email:</label>
                        <input type="email" id="register-email" placeholder="your@example.com"
                               value={registerEmail}
                               onChange={(e) => setRegisterEmail(e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" />
                    </div>
                    <div>
                        <label htmlFor="register-school" className="block text-gray-700 text-lg font-semibold mb-2">School:</label>
                        <input type="text" id="register-school" placeholder="Your School Name" required
                               value={registerSchool}
                               onChange={(e) => setRegisterSchool(e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" />
                    </div>
                    <div>
                        <label htmlFor="register-phone-number" className="block text-gray-700 text-lg font-semibold mb-2">Phone Number:</label>
                        <input type="tel" id="register-phone-number" placeholder="e.g., 9123456789" required
                               value={registerPhoneNumber}
                               onChange={(e) => setRegisterPhoneNumber(e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" />
                    </div>
                    <div>
                        <label htmlFor="register-board" className="block text-gray-700 text-lg font-semibold mb-2">Board:</label>
                        <input type="text" id="register-board" placeholder="e.g., CBSE, ICSE, State Board" required
                               value={registerBoard}
                               onChange={(e) => setRegisterBoard(e.target.value)}
                               className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" />
                    </div>
                    <div>
                        <label htmlFor="register-class" className="block text-gray-700 text-lg font-semibold mb-2">Class:</label>
                        <select id="register-class" className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" required
                                value={registerClass}
                                onChange={(e) => setRegisterClass(e.target.value)}>
                            <option value="" disabled>Select Class</option>
                            {availableClasses.map(cls => (
                                <option key={cls} value={cls}>{cls}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg">
                        Register
                    </button>
                </form>
            )}
        </div>
    );
};

export default Auth; 
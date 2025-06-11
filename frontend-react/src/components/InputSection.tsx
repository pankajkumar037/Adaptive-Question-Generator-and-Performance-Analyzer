import React from 'react';

interface InputSectionProps {
    studentName: string;
    setStudentName: (name: string) => void;
    selectedClass: string;
    setSelectedClass: (cls: string) => void;
    board: string;
    setBoard: (board: string) => void;
    onGenerateQuestions: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({
    studentName,
    setStudentName,
    selectedClass,
    setSelectedClass,
    board,
    setBoard,
    onGenerateQuestions,
}) => {
    const availableClasses = Array.from({length: 10}, (_, i) => i + 1);

    return (
        <div id="input-section" className="space-y-4">
            <div>
                <label htmlFor="student-name" className="block text-gray-700 text-lg font-semibold mb-2">Enter Your Name:</label>
                <input 
                    type="text" 
                    id="student-name" 
                    placeholder="" 
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" 
                />
            </div>

            <div>
                <label htmlFor="class" className="block text-gray-700 text-lg font-semibold mb-2">Class:</label>
                <select 
                    id="class" 
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    disabled={!!selectedClass}
                >
                    <option value="" disabled>Select Class</option>
                    {availableClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                    ))}
                </select>
            </div>

            <div>
                <label htmlFor="board" className="block text-gray-700 text-lg font-semibold mb-2">Board:</label>
                <input 
                    type="text" 
                    id="board" 
                    placeholder="e.g., CBSE, ICSE, State Board"
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    readOnly={!!board}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-200" 
                />
            </div>

            <button 
                onClick={onGenerateQuestions}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition duration-300 ease-in-out transform hover:-translate-y-1 shadow-lg">
                Generate Questions
            </button>
        </div>
    );
};

export default InputSection; 
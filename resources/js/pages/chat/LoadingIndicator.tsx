import React from 'react';
import { motion } from 'framer-motion';


const LoadingIndicator: React.FC = () => {
return (
    <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4"
        >
            <div className="flex items-center space-x-3 text-gray-500 text-sm">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Ассистент набирает ответ...</span>
            </div>
    </motion.div>    
)
}

export default LoadingIndicator;
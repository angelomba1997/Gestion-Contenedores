import React from 'react';

interface HeaderProps {
    establishmentName: string;
}

export const Header: React.FC<HeaderProps> = ({ establishmentName }) => {
    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        G
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Gestión de Contenedores
                    </h1>
                </div>
                <div className="text-right">
                    <span className="text-slate-500 text-sm">Vista</span>
                    <p className="font-semibold text-slate-700">{establishmentName}</p>
                </div>
            </div>
        </header>
    );
};
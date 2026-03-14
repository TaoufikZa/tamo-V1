import React from 'react';

export default function Header() {
    return (
        <header className="bg-tamo-dark p-4 flex flex-col items-center sticky top-0 z-50">
            <img src="/logo.png" alt="tamo" className="h-10 w-auto mb-1" />
            <p className="text-xs text-white opacity-80 uppercase tracking-widest font-bold">Just Speak It.</p>
        </header>
    );
}

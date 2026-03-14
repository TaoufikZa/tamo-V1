import React from 'react';
import Image from 'next/image';

export default function Header() {
    return (
        <header className="bg-tamo-dark p-4 flex flex-col items-center sticky top-0 z-50">
            <Image
                src="/logo.png"
                alt="tamo"
                width={120}
                height={40}
                className="h-10 w-auto mb-1"
                priority
            />
            <p className="text-xs text-white opacity-80 uppercase tracking-widest font-bold">Just Speak It | أطلب بصوتك</p>
        </header>
    );
}

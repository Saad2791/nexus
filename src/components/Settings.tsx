import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto w-full h-full flex flex-col relative z-10">
      <div className="flex justify-between items-end mb-8 shrink-0">
        <div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase leading-none tracking-tighter flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 md:w-10 md:h-10 text-cyan-500" />
            Settings
          </h1>
          <p className="mt-2 text-zinc-400 text-sm md:text-base uppercase font-bold tracking-tight">Configure Nexus OS.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl">
        <SettingsIcon className="w-16 h-16 text-zinc-700 mb-4" />
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-300 mb-2">System Preferences</h2>
        <p className="text-zinc-500 font-medium">Currently in development. Coming soon to Nexus OS.</p>
      </div>
    </div>
  );
}

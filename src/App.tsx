import Viewport from './components/Viewport';
import TopBar from './components/TopBar';
import TcpReadout from './components/TcpReadout';
import PinPad from './components/PinPad';
import JointPanel from './components/JointPanel';
import GotoPanel from './components/GotoPanel';
import Joystick from './components/Joystick';
import ManualPanel from './components/ManualPanel';
import EventLog from './components/EventLog';
import VoicePanel from './voice/VoicePanel';
import AgentPanel from './voice/AgentPanel';

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-100">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <main className="relative min-w-0 flex-1">
          <Viewport />
        </main>
        <aside className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-l border-slate-800 bg-slate-950 p-3 lg:w-96">
          <TcpReadout />
          <VoicePanel />
          <AgentPanel />
          <PinPad />
          <GotoPanel />
          <JointPanel />
          <Joystick />
          <ManualPanel />
          <EventLog />
        </aside>
      </div>
    </div>
  );
}

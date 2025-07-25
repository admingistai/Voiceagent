"use client";

import { LoadingSVG } from "@/components/button/LoadingSVG";
import { Header } from "@/components/Header";
import { Tile } from "@/components/Tile";
import { AgentMultibandAudioVisualizer } from "@/components/visualization/AgentMultibandAudioVisualizer";
import DivineHaloVisualizer from "@/components/visualization/DivineHaloVisualizer";
import { useMultibandTrackVolume } from "@/hooks/useTrackVolume";
import { useWindowResize } from "@/hooks/useWindowResize";
import {
  useConnectionState,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { ConnectionState, LocalParticipant, Track } from "livekit-client";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "./button/Button";
import { MicrophoneButton } from "./MicrophoneButton";
import { MenuSVG } from "./ui/icons";

export interface AssistantProps {
  title?: string;
  logo?: ReactNode;
  onConnect: (connect: boolean, opts?: { token: string; url: string }) => void;
}

export interface Voice {
  id: string;
  user_id: string | null;
  is_public: boolean;
  name: string;
  description: string;
  created_at: Date;
  embedding: number[];
}

const headerHeight = 56;
const mobileWindowWidth = 768;
const desktopBarWidth = 72;
const desktopMaxBarHeight = 280;
const desktopMinBarHeight = 60;
const mobileMaxBarHeight = 140;
const mobileMinBarHeight = 48;
const mobileBarWidth = 48;
const barCount = 5;
const defaultVolumes = Array.from({ length: barCount }, () => [0.0]);

export default function Assistant({ title, logo, onConnect }: AssistantProps) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const { localParticipant } = useLocalParticipant();
  const [currentVoiceId, setCurrentVoiceId] = useState<string>("");
  const [showVoices, setShowVoices] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState<'divine' | 'particles' | 'wave'>('divine');
  const [sensitivity, setSensitivity] = useState(0.02); // Default to 2%
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const windowSize = useWindowResize();
  const {
    agent: agentParticipant,
    state: agentState,
    audioTrack: agentAudioTrack,
    agentAttributes,
  } = useVoiceAssistant();
  const [isMobile, setIsMobile] = useState(false);
  const isAgentConnected = agentParticipant !== undefined;

  const roomState = useConnectionState();
  const tracks = useTracks();

  useEffect(() => {
    setShowVoices(windowSize.width >= mobileWindowWidth);
    setIsMobile(windowSize.width < mobileWindowWidth);
  }, [windowSize]);

  useEffect(() => {
    if (roomState === ConnectionState.Connected) {
      localParticipant.setMicrophoneEnabled(true);
    }
  }, [localParticipant, roomState]);

  // use voices provided by the agent
  useEffect(() => {
    if (agentAttributes?.voices) {
      setVoices(JSON.parse(agentAttributes.voices));
    }
  }, [agentAttributes?.voices]);

  const subscribedVolumes = useMultibandTrackVolume(
    agentAudioTrack?.publication.track,
    barCount
  );

  const localTracks = tracks.filter(
    ({ participant }) => participant instanceof LocalParticipant
  );
  const localMicTrack = localTracks.find(
    ({ source }) => source === Track.Source.Microphone
  );

  const localMultibandVolume = useMultibandTrackVolume(
    localMicTrack?.publication.track,
    9
  );

  const onSelectVoice = useCallback(
    (voiceId: string) => {
      setCurrentVoiceId(voiceId);
      localParticipant.setAttributes({
        voice: voiceId,
      });
    },
    [localParticipant, setCurrentVoiceId]
  );

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFaceImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const audioTileContent = useMemo(() => {
    const conversationToolbar = (
      <div className="fixed z-50 md:absolute left-1/2 bottom-4 md:bottom-auto md:top-1/2 -translate-y-1/2 -translate-x-1/2">
        <motion.div
          className="flex gap-3"
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 25,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <Button
            state="destructive"
            className=""
            size="medium"
            onClick={() => {
              onConnect(roomState === ConnectionState.Disconnected);
            }}
          >
            Disconnect
          </Button>
          <MicrophoneButton localMultibandVolume={localMultibandVolume} />
          <Button
            state="secondary"
            size="medium"
            onClick={() => {
              setShowVoices(!showVoices);
            }}
          >
            <MenuSVG />
          </Button>
        </motion.div>
      </div>
    );
    const isLoading =
      roomState === ConnectionState.Connecting ||
      (!agentAudioTrack && roomState === ConnectionState.Connected);
    const startConversationButton = (
      <div className="fixed bottom-2 md:bottom-auto md:absolute left-1/2 md:top-1/2 -translate-y-1/2 -translate-x-1/2 w-11/12 md:w-auto text-center">
        <motion.div
          className="flex gap-3"
          initial={{
            opacity: 0,
            y: 50,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          exit={{
            opacity: 0,
            y: 50,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <Button
            state="primary"
            size="large"
            className="relative w-full text-sm md:text-base"
            onClick={() => {
              onConnect(roomState === ConnectionState.Disconnected);
            }}
          >
            <div
              className={`w-full ${isLoading ? "opacity-0" : "opacity-100"}`}
            >
              Start a conversation
            </div>
            <div
              className={`absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 ${
                isLoading ? "opacity-100" : "opacity-0"
              }`}
            >
              <LoadingSVG diameter={24} strokeWidth={4} />
            </div>
          </Button>
        </motion.div>
      </div>
    );
    const visualizerContent = (
      <div className="flex flex-col items-center justify-space-between h-full w-full relative bg-[#0a0a0a]">
        <div className="h-full w-full flex flex-col items-center">
          <DivineHaloVisualizer
            frequencyData={!agentAudioTrack ? null : subscribedVolumes}
            state={agentState}
            sensitivity={sensitivity}
            visualizationMode={visualizationMode}
            faceImage={faceImage}
          />
        </div>
        <div className="absolute top-4 left-4 flex flex-col gap-3 bg-black/80 backdrop-blur-lg p-4 rounded-xl border border-purple-600/20">
          <div className="flex gap-2">
            <button
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                visualizationMode === 'divine' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              onClick={() => setVisualizationMode('divine')}
            >
              Divine Halo
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                visualizationMode === 'particles' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              onClick={() => setVisualizationMode('particles')}
            >
              Particles
            </button>
            <button
              className={`px-3 py-1.5 rounded text-sm transition-all ${
                visualizationMode === 'wave' ? 'bg-purple-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              onClick={() => setVisualizationMode('wave')}
            >
              Wave
            </button>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-white text-sm">Sensitivity:</label>
            <input
              type="range"
              min="10"
              max="200"
              value={sensitivity * 100}
              onChange={(e) => setSensitivity(Number(e.target.value) / 100)}
              className="w-32 accent-purple-600"
              style={{
                background: `linear-gradient(to right, #8B2BE2 0%, #8B2BE2 ${(sensitivity * 100 - 10) / 1.9}%, rgba(255,255,255,0.1) ${(sensitivity * 100 - 10) / 1.9}%, rgba(255,255,255,0.1) 100%)`
              }}
            />
            <span className="text-purple-400 font-semibold text-sm w-12">{Math.round(sensitivity * 100)}%</span>
          </div>
          <div>
            <input
              type="file"
              id="faceImageUpload"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => document.getElementById('faceImageUpload')?.click()}
              className="px-3 py-1.5 bg-purple-600/20 text-purple-300 border border-purple-600/30 rounded text-sm hover:bg-purple-600/30 hover:text-white transition-all"
            >
              Upload Face Image
            </button>
          </div>
        </div>
        <div className="min-h-20 w-full relative">
          <AnimatePresence>
            {!agentAudioTrack ? startConversationButton : null}
          </AnimatePresence>
          <AnimatePresence>
            {agentAudioTrack ? conversationToolbar : null}
          </AnimatePresence>
        </div>
      </div>
    );

    return visualizerContent;
  }, [
    localMultibandVolume,
    showVoices,
    roomState,
    agentAudioTrack,
    subscribedVolumes,
    onConnect,
    agentState,
    visualizationMode,
    sensitivity,
    faceImage,
    handleImageUpload,
  ]);

  const voiceSelectionPanel = useMemo(() => {
    return (
      <div className="flex flex-col h-full w-full items-start">
        {isAgentConnected && voices && voices.length > 0 && (
          <div className="w-full text-foreground py-4 relative">
            <div className="sticky bg-background py-2 top-0 flex flex-row justify-between items-center px-4 text-xs uppercase tracking-wider">
              <h3 className="font-mono font-semibold text-sm">Voices</h3>
            </div>
            <div className="px-4 py-2 text-xs text-foreground leading-normal">
              <div className={"flex flex-col text-left h-full"}>
                {voices.map((voice) => (
                  <button
                    onClick={() => {
                      onSelectVoice(voice.id);
                    }}
                    className={`w-full text-left px-3 py-2 font-mono text-lg md:text-sm ${
                      voice.id === currentVoiceId
                        ? "bg-foreground text-background"
                        : "hover:bg-white/10"
                    }`}
                    key={voice.id}
                  >
                    {voice.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }, [isAgentConnected, voices, currentVoiceId, onSelectVoice]);

  return (
    <>
      <Header
        title={title}
        logo={logo}
        height={headerHeight}
        onConnectClicked={() =>
          onConnect(roomState === ConnectionState.Disconnected)
        }
      />
      <div
        className={`flex grow w-full selection:bg-cyan-900`}
        style={{ height: `calc(100% - ${headerHeight}px)` }}
      >
        <div className="flex-col grow basis-1/2 gap-4 h-full md:flex">
          <Tile
            title=""
            className="w-full h-full grow bg-[#0a0a0a]"
            childrenClassName="justify-center p-0"
            padding={false}
          >
            {audioTileContent}
          </Tile>
        </div>
        <Tile
          padding={false}
          className={`h-full w-full basis-1/4 items-start overflow-y-auto hidden max-w-[480px] border-l border-white/20 ${
            showVoices ? "md:flex" : "md:hidden"
          }`}
          childrenClassName="h-full grow items-start"
        >
          {voiceSelectionPanel}
        </Tile>
        <div
          className={`bg-white/80 backdrop-blur-lg absolute w-full items-start transition-all duration-100 md:hidden ${
            showVoices ? "translate-x-0" : "translate-x-full"
          }`}
          style={{ height: `calc(100% - ${headerHeight}px)` }}
        >
          <div className="overflow-y-scroll h-full w-full">
            <div className="pb-32">{voiceSelectionPanel}</div>
          </div>
          <div className="pointer-events-none absolute z-10 bottom-0 w-full h-64 bg-gradient-to-t from-white to-transparent"></div>
        </div>
      </div>
    </>
  );
}

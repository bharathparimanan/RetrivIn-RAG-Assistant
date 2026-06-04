import React, { useState } from 'react';
import SourcePanel from './SourcePanel';
import SummarisationWindow from './SummarisationWindow';
import AddSourceModal from './AddSourceModal';
import type { SourceItem, ChatMessage } from '../../types/sourcing';
import './SearchView.css';

const INITIAL_SOURCES: SourceItem[] = [];

export const SearchView: React.FC = () => {
  const [sources, setSources] = useState<SourceItem[]>(INITIAL_SOURCES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [hasDeepResearch, setHasDeepResearch] = useState(false);
  const [chatValue, setChatValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Toggle selected sources
  const handleToggleSelect = (id: string) => {
    setSources(prev =>
      prev.map(src => {
        if (src.id === id) {
          if (!src.connected) {
            alert(`Connect the ${src.type} platform first using the connectors toggle.`);
            return src;
          }
          return { ...src, selected: !src.selected };
        }
        return src;
      })
    );
  };

  // Toggle connected state for LinkedIn / GitHub
  const handleToggleConnect = (type: 'linkedin' | 'github') => {
    setSources(prev => {
      const isConnected = prev.some(s => s.type === type && s.connected);
      return prev.map(src => {
        if (src.type === type) {
          return { 
            ...src, 
            connected: !isConnected,
            selected: isConnected ? false : src.selected 
          };
        }
        return src;
      });
    });
  };

  // Add source logic
  const handleAddSource = (
    type: 'youtube' | 'report' | 'resource' | 'attachment',
    name: string
  ) => {
    const newSource: SourceItem = {
      id: `s_search_${Date.now()}`,
      type,
      name,
      connected: true,
      selected: true,
    };
    setSources(prev => [...prev, newSource]);
  };

  // Pin insights logic
  const handlePin = (type: 'note' | 'project', text: string) => {
    console.log(`Pinned to ${type}:`, text);
  };

  // Send message simulation
  const handleSendMessage = (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg_search_u_${Date.now()}`,
      role: 'user',
      text,
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatValue('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const activeSourceNames = sources
        .filter(s => s.selected)
        .map(s => s.name)
        .join(', ');

      const assistantMsg: ChatMessage = {
        id: `msg_search_a_${Date.now()}`,
        role: 'assistant',
        text: `Ingested selected context: [${activeSourceNames}]. Regarding your search query "${text.substring(0, 35)}...", I recommend focusing your notes on consumer lag metrics, load rebalancing patterns, and outcome-oriented experience definitions in your documentation review.`,
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    }, 800);
  };

  const selectedSources = sources.filter(s => s.selected);

  return (
    <div className="search-view-container">
      <SourcePanel
        sources={sources}
        onToggleSelect={handleToggleSelect}
        onToggleConnect={handleToggleConnect}
        onOpenAddModal={() => setModalOpen(true)}
      />

      <SummarisationWindow
        selectedSources={selectedSources}
        chatMessages={chatMessages}
        onSendMessage={handleSendMessage}
        onPin={handlePin}
        onDeepResearch={() => setHasDeepResearch(true)}
        hasDeepResearch={hasDeepResearch}
        chatValue={chatValue}
        setChatValue={setChatValue}
        isTyping={isTyping}
      />

      {modalOpen && (
        <AddSourceModal
          onClose={() => setModalOpen(false)}
          onAdd={handleAddSource}
        />
      )}
    </div>
  );
};

export default SearchView;

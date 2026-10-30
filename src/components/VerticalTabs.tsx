import React, { useState } from 'react';
import { Tab, TabGroup } from '../types';
import { ChevronDown, ChevronRight, Plus, X, Pin, VolumeX, Layers } from 'lucide-react';

interface VerticalTabsProps {
  tabs: Tab[];
  tabGroups: TabGroup[];
  activeTabId: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, e?: React.MouseEvent) => void;
  onNewTab: () => void;
  onTogglePin: (id: string) => void;
  onCreateGroup: () => void;
  onToggleGroup: (groupId: string) => void;
  onAddToGroup: (tabId: string, groupId: string) => void;
}

export function VerticalTabs({
  tabs,
  tabGroups,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onNewTab,
  onTogglePin,
  onCreateGroup,
  onToggleGroup,
  onAddToGroup,
}: VerticalTabsProps) {
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  
  const groupedTabs = tabGroups.map(group => ({
    group,
    tabs: tabs.filter(tab => group.tabIds.includes(tab.id))
  }));
  
  const ungroupedTabs = tabs.filter(tab => 
    !tabGroups.some(group => group.tabIds.includes(tab.id))
  );

  const renderTab = (tab: Tab) => (
    <div
      key={tab.id}
      className={`vertical-tab ${activeTabId === tab.id ? 'active' : ''} ${tab.pinned ? 'pinned' : ''} ${tab.muted ? 'muted' : ''}`}
      onClick={() => onSelectTab(tab.id)}
      draggable
      onDragStart={(e) => {
        setDraggedTab(tab.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => setDraggedTab(null)}
    >
      <div className="vertical-tab-favicon">
        {tab.favicon ? (
          <img src={tab.favicon} alt="" />
        ) : (
          <div className="vertical-tab-favicon-default" />
        )}
      </div>
      <div className="vertical-tab-title">{tab.title || tab.url}</div>
      <div className="vertical-tab-actions">
        {tab.muted && <VolumeX size={12} />}
        {tab.pinned && <Pin size={12} />}
        <button
          className="vertical-tab-close"
          onClick={(e) => {
            e.stopPropagation();
            onCloseTab(tab.id, e);
          }}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="vertical-tabs-sidebar">
      <div className="vertical-tabs-header">
        <div className="vertical-tabs-title">
          <Layers size={16} />
          <span>Tabs</span>
        </div>
        <button className="vertical-tabs-new" onClick={onNewTab}>
          <Plus size={16} />
        </button>
      </div>
      
      <div className="vertical-tabs-content">
        {groupedTabs.map(({ group, tabs: groupTabs }) => (
          <div key={group.id} className="tab-group">
            <div 
              className="tab-group-header"
              style={{ borderLeftColor: group.color }}
              onClick={() => onToggleGroup(group.id)}
            >
              {group.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <span className="tab-group-name">{group.name}</span>
              <span className="tab-group-count">{groupTabs.length}</span>
            </div>
            {!group.collapsed && (
              <div className="tab-group-tabs">
                {groupTabs.map(renderTab)}
              </div>
            )}
          </div>
        ))}
        
        {ungroupedTabs.length > 0 && (
          <div className="ungrouped-section">
            <div className="ungrouped-header">
              <span>Other tabs</span>
            </div>
            <div className="ungrouped-tabs">
              {ungroupedTabs.map(renderTab)}
            </div>
          </div>
        )}
      </div>
      
      <div className="vertical-tabs-footer">
        <button className="vertical-tabs-create-group" onClick={onCreateGroup}>
          <Plus size={14} />
          <span>Create group</span>
        </button>
      </div>
    </div>
  );
}
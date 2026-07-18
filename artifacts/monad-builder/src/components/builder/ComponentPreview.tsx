import { Wallet, Coins, Image as ImageIcon, List, RefreshCw, LineChart, Vote, Type, AlignLeft, Square, PictureInPicture, Minus, LayoutTemplate, CreditCard, BarChart2, X, ChevronUp, ChevronDown } from "lucide-react";
import { ComponentData } from "@workspace/api-client-react";

const ICONS: Record<string, any> = {
  'wallet-connect': Wallet,
  'token-balance': Coins,
  'nft-gallery': ImageIcon,
  'transaction-feed': List,
  'token-swap': RefreshCw,
  'price-chart': LineChart,
  'dao-vote': Vote,
  'hero-section': LayoutTemplate,
  'card': CreditCard,
  'stats-row': BarChart2,
  'divider': Minus,
  'heading': Type,
  'paragraph': AlignLeft,
  'button': Square,
  'image': PictureInPicture
};

interface ComponentPreviewProps {
  component: ComponentData;
  isSelected: boolean;
  onSelect: () => void;
  onMoveUp: (e: React.MouseEvent) => void;
  onMoveDown: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  isFirst: boolean;
  isLast: boolean;
}

export function ComponentPreview({ 
  component, 
  isSelected, 
  onSelect, 
  onMoveUp, 
  onMoveDown, 
  onDelete,
  isFirst,
  isLast
}: ComponentPreviewProps) {
  const Icon = ICONS[component.type] || Square;
  
  return (
    <div 
      onClick={onSelect}
      className={`relative group p-4 rounded-lg border-2 transition-all cursor-pointer bg-white/[0.02] ${
        isSelected ? 'border-primary shadow-[0_0_15px_rgba(131,110,249,0.2)]' : 'border-transparent hover:border-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white/50 text-xs font-mono uppercase tracking-wider">
          <Icon className="w-4 h-4" />
          <span>{component.type.replace('-', ' ')}</span>
        </div>
        
        {/* Controls - visible on hover or when selected */}
        <div className={`flex items-center gap-1 bg-black/60 rounded border border-white/10 p-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <button 
            onClick={onMoveUp} 
            disabled={isFirst}
            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button 
            onClick={onMoveDown} 
            disabled={isLast}
            className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
          <div className="w-px h-3 bg-white/20 mx-1" />
          <button 
            onClick={onDelete}
            className="p-1 hover:bg-destructive/20 text-destructive rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Mock Visual representation inside builder */}
      <div className="opacity-80 pointer-events-none">
        {renderMock(component)}
      </div>
    </div>
  );
}

function renderMock(component: ComponentData) {
  const { type } = component;
  const props = component.props as Record<string, any>;
  
  switch(type) {
    case 'wallet-connect':
      return <div className="h-10 bg-primary/20 border border-primary/50 rounded-md flex items-center justify-center text-primary font-bold text-sm w-40">{props.label || 'Connect Wallet'}</div>;
    case 'heading':
      return <div className="text-2xl font-bold text-white">{props.text || 'Heading'}</div>;
    case 'paragraph':
      return <div className="text-white/60 text-sm">{props.text || 'Paragraph text here...'}</div>;
    case 'button':
      return <div className="h-10 bg-white/10 rounded-md flex items-center justify-center text-white text-sm w-32 border border-white/20">{props.label || 'Button'}</div>;
    case 'token-balance':
      return (
        <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center"><Coins className="w-4 h-4 text-primary" /></div>
            <span className="font-bold text-white">{props.token || 'TOKEN'}</span>
          </div>
          <span className="font-mono text-xl font-bold">1,234.56</span>
        </div>
      );
    case 'token-swap':
      return (
        <div className="bg-black/40 border border-white/10 rounded-lg p-4 space-y-2 max-w-sm">
          <div className="bg-black/40 border border-white/5 rounded p-3 text-right font-mono text-xl text-white/50">0.0</div>
          <div className="flex justify-center -my-3 relative z-10"><div className="bg-card p-1 rounded-full border border-white/10"><RefreshCw className="w-4 h-4 text-primary" /></div></div>
          <div className="bg-black/40 border border-white/5 rounded p-3 text-right font-mono text-xl text-white/50">0.0</div>
          <div className="h-10 bg-primary/20 border border-primary/50 rounded flex items-center justify-center text-primary font-bold mt-2">Swap</div>
        </div>
      );
    case 'divider':
      return <div className="h-px bg-white/10 w-full my-4" />;
    case 'card':
      return <div className="bg-black/40 border border-white/10 rounded-xl p-6 h-32 flex flex-col items-center justify-center text-white/40 border-dashed">{props.title || 'Card Container'}</div>;
    default:
      return <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center text-sm text-white/40 h-24 flex items-center justify-center">[{type} primitive]</div>;
  }
}

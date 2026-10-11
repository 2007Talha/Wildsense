import { useAppStore } from '../../store/app-store';
import { Cpu, Cloud, BookOpen, Loader2 } from 'lucide-react';

export function AIStatusBadge({ compact = false }: { compact?: boolean }) {
  const aiStatus = useAppStore((s) => s.aiStatus);

  const getIcon = () => {
    if (aiStatus.loading) return <Loader2 className="w-3 h-3 animate-spin" />;
    if (aiStatus.provider.includes('Ollama')) return <Cpu className="w-3 h-3" />;
    if (aiStatus.provider.includes('Curated')) return <BookOpen className="w-3 h-3" />;
    return <Cloud className="w-3 h-3" />;
  };

  const getColor = () => {
    if (aiStatus.loading) return 'bg-sky/20 text-sky';
    if (aiStatus.provider.includes('Ollama')) return 'bg-moss/15 text-moss';
    if (aiStatus.provider.includes('Curated')) return 'bg-sunset/15 text-bark';
    return 'bg-sage/20 text-deep-green';
  };

  const getLabel = () => {
    if (aiStatus.loading) return 'Loading AI...';
    if (aiStatus.provider.includes('Ollama')) return compact ? 'Local AI' : 'Ollama — Local AI';
    if (aiStatus.provider.includes('Curated')) return compact ? 'Curated' : 'Curated Missions';
    return aiStatus.provider;
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getColor()}`}>
      {getIcon()}
      <span>{getLabel()}</span>
      {aiStatus.isLocal && !aiStatus.loading && (
        <span className="w-1.5 h-1.5 rounded-full bg-moss" title="Running locally" />
      )}
    </div>
  );
}

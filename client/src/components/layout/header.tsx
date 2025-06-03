import { Button } from "@/components/ui/button";
import { Play, User } from "lucide-react";

interface HeaderProps {
  title: string;
  description: string;
  onStartCollection?: () => void;
  isCollecting?: boolean;
}

export default function Header({ 
  title, 
  description, 
  onStartCollection,
  isCollecting = false 
}: HeaderProps) {
  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          {onStartCollection && (
            <Button 
              onClick={onStartCollection}
              disabled={isCollecting}
            >
              <Play className="mr-2 h-4 w-4" />
              {isCollecting ? "採集中..." : "開始採集"}
            </Button>
          )}
          <div className="flex items-center space-x-2 text-muted-foreground">
            <User className="h-5 w-5" />
            <span className="font-medium">管理員</span>
          </div>
        </div>
      </div>
    </header>
  );
}

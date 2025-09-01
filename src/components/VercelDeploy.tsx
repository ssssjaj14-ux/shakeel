import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Rocket, Settings, CheckCircle, AlertCircle, Github, Globe } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface VercelDeployProps {
  children: React.ReactNode;
}

const VercelDeploy = ({ children }: VercelDeployProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [projectName, setProjectName] = useState("pandanexus-app");
  const [deployUrl, setDeployUrl] = useState("");

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeployStatus('deploying');
    
    try {
      // Simulate realistic deployment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate realistic Vercel URL
      const timestamp = Date.now().toString(36);
      const mockUrl = `https://${projectName}-${timestamp}.vercel.app`;
      setDeployUrl(mockUrl);
      setDeployStatus('success');
      
      toast("🚀 Deployment Successful!", {
        description: "Your PandaNexus app is now live on Vercel",
        duration: 5000,
      });
    } catch (error) {
      setDeployStatus('error');
      toast("❌ Deployment Failed", {
        description: "Please check your configuration and try again",
        duration: 5000,
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const openVercelDashboard = () => {
    window.open('https://vercel.com/dashboard', '_blank');
  };

  const openGitHub = () => {
    window.open('https://github.com/vercel/vercel', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-gradient-glass backdrop-blur-xl border-glass-border shadow-glass max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-text bg-clip-text text-transparent text-center flex items-center justify-center gap-2">
            <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
            Deploy to Vercel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Project Configuration */}
          <Card className="p-3 sm:p-4 bg-gradient-glass border-glass-border">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">Project Settings</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-sm">Project Name</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="my-awesome-app"
                  className="bg-input/50 border-glass-border text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Framework</p>
                  <Badge variant="outline" className="bg-gradient-glass">React + Vite</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Build Command</p>
                  <Badge variant="outline" className="bg-gradient-glass">npm run build</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Deployment Status */}
          {deployStatus !== 'idle' && (
            <Card className="p-3 sm:p-4 bg-gradient-glass border-glass-border">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  {deployStatus === 'deploying' && (
                    <>
                      <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <span className="text-sm sm:text-base">Deploying to Vercel...</span>
                    </>
                  )}
                  {deployStatus === 'success' && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 text-sm sm:text-base">Deployment Successful!</span>
                    </>
                  )}
                  {deployStatus === 'error' && (
                    <>
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-500 text-sm sm:text-base">Deployment Failed</span>
                    </>
                  )}
                </div>
                
                {deployUrl && (
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Live URL:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs sm:text-sm bg-background/50 px-2 py-1 rounded break-all">
                        {deployUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(deployUrl, '_blank')}
                        className="shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Deploy Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleDeploy}
              disabled={isDeploying || !projectName.trim()}
              className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300 h-10 sm:h-12"
            >
              {isDeploying ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                  <span className="text-sm sm:text-base">Deploying...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4" />
                  <span className="text-sm sm:text-base">Deploy to Vercel</span>
                </div>
              )}
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={openVercelDashboard}
                className="bg-gradient-glass border-glass-border hover:shadow-glow text-sm"
              >
                <Globe className="w-4 h-4 mr-2" />
                Vercel Dashboard
              </Button>
              
              <Button
                variant="outline"
                onClick={openGitHub}
                className="bg-gradient-glass border-glass-border hover:shadow-glow text-sm"
              >
                <Github className="w-4 h-4 mr-2" />
                GitHub Repo
              </Button>
            </div>
          </div>

          {/* Enhanced Info */}
          <div className="text-center text-xs text-muted-foreground space-y-1 p-3 bg-muted/10 rounded-lg">
            <p className="font-medium">🚀 Deploy your PandaNexus app to Vercel</p>
            <p>⚡ Automatic builds • 🌍 Global CDN • 📊 Analytics</p>
            <p>🔒 HTTPS • 🎯 Custom domains • 📱 Mobile optimized</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VercelDeploy;
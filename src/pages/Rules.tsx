
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Shield, Trophy, Users, AlertTriangle } from "lucide-react";

export default function Rules() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
          <BookOpen className="w-8 h-8" />
          Game Rules & Guidelines
        </h1>
        <p className="text-gray-400">Fair play is our priority</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Match Rules
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <p>• All matches must be played fairly without any cheats or hacks</p>
            <p>• Screenshots of match results are required for verification</p>
            <p>• Match disputes will be reviewed by admin team</p>
            <p>• Players must join matches with sufficient balance</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              Fair Play Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <p>• Use of any third-party software or cheats is strictly prohibited</p>
            <p>• Multiple accounts per user are not allowed</p>
            <p>• Match fixing or collusion will result in permanent ban</p>
            <p>• All gameplay must be legitimate and skill-based</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Community Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <p>• Respect all players and maintain good sportsmanship</p>
            <p>• No toxic behavior, harassment, or abusive language</p>
            <p>• Report suspicious activities to admin team</p>
            <p>• Help maintain a positive gaming environment</p>
          </CardContent>
        </Card>

        <Card className="bg-red-900/20 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Violations & Penalties
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <p>• <strong>Warning:</strong> Minor rule violations</p>
            <p>• <strong>Temporary Ban:</strong> Repeated violations or unsportsmanlike conduct</p>
            <p>• <strong>Permanent Ban:</strong> Cheating, hacking, or severe misconduct</p>
            <p>• <strong>Account Freeze:</strong> Suspicious activities under investigation</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

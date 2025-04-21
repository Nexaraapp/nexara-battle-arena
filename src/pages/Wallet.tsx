
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, ArrowDown, ArrowUp, Clock, Eye, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Transaction {
  id: number;
  type: string;
  amount: number;
  date: string;
  status: string;
}

interface CoinPackage {
  id: number;
  coins: number;
  amount: string;
  popular: boolean;
}

const Wallet = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [walletBalance, setWalletBalance] = useState(0); // Default to 0 coins for new users
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  
  const coinPackages: CoinPackage[] = [
    { id: 1, coins: 20, amount: "₹20", popular: false },
    { id: 2, coins: 60, amount: "₹50", popular: true },
    { id: 3, coins: 120, amount: "₹100", popular: false },
    { id: 4, coins: 300, amount: "₹250", popular: false },
  ];

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login to access your wallet");
        navigate("/login");
        return;
      }
      
      setUser(session.user);
      fetchWalletData(session.user.id);
      
      // Check if this is a first-time user
      const firstTimeUserKey = `welcome_shown_${session.user.id}`;
      if (!localStorage.getItem(firstTimeUserKey)) {
        setShowWelcomeDialog(true);
        localStorage.setItem(firstTimeUserKey, 'true');
      }
    };

    const fetchWalletData = async (userId: string) => {
      try {
        // For a new user, start with 0 balance instead of 125
        setWalletBalance(0);

        // For a new user, start with an empty transaction history
        setTransactions([]);
        
        // In a real app, you would create/fetch wallet data from your database
        // Example pseudocode (not implemented):
        // const { data, error } = await supabase
        //   .from('wallet_balances')
        //   .select('*')
        //   .eq('user_id', userId)
        //   .single();
        //
        // if (!data) {
        //   // Create new wallet for user with 0 balance
        //   await supabase
        //     .from('wallet_balances')
        //     .insert({ user_id: userId, balance: 0 });
        //   setWalletBalance(0);
        // } else {
        //   setWalletBalance(data.balance);
        // }
        //
        // const { data: transactionsData } = await supabase
        //   .from('wallet_transactions')
        //   .select('*')
        //   .eq('user_id', userId)
        //   .order('created_at', { ascending: false });
        //
        // if (transactionsData) {
        //   setTransactions(transactionsData);
        // }
      } catch (error: any) {
        console.error("Error fetching wallet data:", error);
        toast.error("Failed to load wallet data");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    return () => {
      // Cleanup if needed
    };
  }, [navigate]);

  const handleWatchAd = () => {
    // Simulate watching an ad
    setShowAdDialog(false);
    
    // In a real app, you would call an API to verify the ad was watched
    // and update the user's balance
    setWalletBalance((prev) => prev + 1);
    
    // Add transaction for the ad reward
    const newTransaction = {
      id: Date.now(),
      type: "ad_reward",
      amount: 1,
      date: new Date().toISOString().split('T')[0],
      status: "completed"
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    
    toast.success("Thanks for watching! 1 coin added to your wallet.");
  };

  const handleBuyCoinPack = (packageId: number) => {
    const selectedPackage = coinPackages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      // In a real app, you would redirect to a payment gateway
      toast.success(`Redirecting to payment for ${selectedPackage.coins} coins`);
      
      // For demo, let's simulate a successful payment after a delay
      setTimeout(() => {
        setWalletBalance((prev) => prev + selectedPackage.coins);
        toast.success(`${selectedPackage.coins} coins added to your wallet!`);
        
        // Add to transactions
        const newTransaction = {
          id: Date.now(),
          type: "topup",
          amount: selectedPackage.coins,
          date: new Date().toISOString().split('T')[0],
          status: "completed"
        };
        
        setTransactions([newTransaction, ...transactions]);
      }, 2000);
    }
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount);
    
    if (isNaN(amount) || amount < 50) {
      toast.error("Minimum withdrawal is 50 coins");
      return;
    }
    
    if (amount > walletBalance) {
      toast.error("Insufficient balance");
      return;
    }
    
    // In a real app, you would submit a withdrawal request to your backend
    toast.success(`Withdrawal request for ${amount} coins submitted. Upload payment QR.`);
    
    // Add to transactions as pending
    const newTransaction = {
      id: Date.now(),
      type: "withdrawal",
      amount: -amount,
      date: new Date().toISOString().split('T')[0],
      status: "pending"
    };
    
    setTransactions([newTransaction, ...transactions]);
    setWalletBalance((prev) => prev - amount);
    setWithdrawAmount("");
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-nexara-accent" />
        <p className="mt-4 text-gray-400">Loading wallet data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="text-gray-400">Manage your game coins and transactions</p>
      </header>

      <Card className="neon-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-center text-2xl">Your Balance</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-nexara-accent/20 flex items-center justify-center">
              <WalletIcon size={32} className="text-nexara-accent" />
            </div>
          </div>
          <div className="text-4xl font-bold mb-2">{walletBalance} coins</div>
          <div className="flex justify-center gap-3 mt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="game-button">
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Top Up
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-nexara-bg border-nexara-accent neon-border">
                <DialogHeader>
                  <DialogTitle className="text-nexara-accent">Buy Coins</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Choose a coin package to purchase
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  {coinPackages.map((pkg) => (
                    <Card 
                      key={pkg.id}
                      className={`relative overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                        pkg.popular ? 'neon-border' : 'border-gray-700'
                      }`}
                      onClick={() => handleBuyCoinPack(pkg.id)}
                    >
                      {pkg.popular && (
                        <div className="absolute top-0 right-0 bg-nexara-accent text-white text-xs px-2 py-1">
                          Popular
                        </div>
                      )}
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold mb-1">{pkg.coins}</div>
                        <div className="text-gray-400 text-sm">Coins</div>
                        <div className="mt-2 font-semibold">{pkg.amount}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="border-nexara-accent/20 w-full">
                        <File className="mr-2 h-4 w-4" />
                        Upload Payment QR
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-nexara-bg border-nexara-accent">
                      <DialogHeader>
                        <DialogTitle>Upload Payment QR Code</DialogTitle>
                        <DialogDescription>
                          Upload a screenshot of your payment QR code
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          type="file"
                          className="bg-muted border-nexara-accent/30"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Upload a screenshot of your payment QR code. Our team will verify and add coins to your account.
                        </p>
                      </div>
                      <Button className="w-full game-button">
                        Upload & Submit
                      </Button>
                    </DialogContent>
                  </Dialog>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-nexara-accent/20">
                  <ArrowDown className="mr-2 h-4 w-4" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-nexara-bg border-nexara-accent neon-border">
                <DialogHeader>
                  <DialogTitle className="text-nexara-accent">Withdraw Coins</DialogTitle>
                  <DialogDescription>
                    Enter the amount you want to withdraw
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleWithdrawSubmit} className="space-y-4 py-4">
                  <div>
                    <Input
                      type="number"
                      placeholder="Amount (minimum 50 coins)"
                      className="bg-muted border-nexara-accent/30"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      You can withdraw coins at a rate of ₹1 per coin.
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full game-button">
                        Submit Withdrawal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-nexara-bg border-nexara-accent">
                      <DialogHeader>
                        <DialogTitle>Upload Payment QR Code</DialogTitle>
                        <DialogDescription>
                          Provide your payment details to receive funds
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          type="file"
                          className="bg-muted border-nexara-accent/30"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Upload your payment QR code for receiving the withdrawal amount.
                        </p>
                      </div>
                      <Button className="w-full game-button">
                        Upload & Confirm
                      </Button>
                    </DialogContent>
                  </Dialog>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Button 
            variant="ghost" 
            className="mt-4 text-sm text-gray-400 hover:text-nexara-accent"
            onClick={() => setShowAdDialog(true)}
          >
            <Eye className="mr-2 h-4 w-4" /> Watch ad for 1 free coin
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Stats</CardTitle>
              <CardDescription>Your wallet activity summary</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Total Earned</p>
                  <p className="text-2xl font-medium">
                    {transactions
                      .filter(t => t.amount > 0)
                      .reduce((sum, t) => sum + t.amount, 0)} coins
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-medium">
                    {Math.abs(transactions
                      .filter(t => t.amount < 0 && t.type !== "withdrawal")
                      .reduce((sum, t) => sum + t.amount, 0))} coins
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Pending Withdrawals</p>
                  <p className="text-2xl font-medium">
                    {Math.abs(transactions
                      .filter(t => t.type === "withdrawal" && t.status === "pending")
                      .reduce((sum, t) => sum + t.amount, 0))} coins
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Ad Rewards</p>
                  <p className="text-2xl font-medium">
                    {transactions
                      .filter(t => t.type === "ad_reward")
                      .reduce((sum, t) => sum + t.amount, 0)} coins
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Pending Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {transactions
                  .filter(t => t.status === "pending")
                  .map(transaction => (
                    <div key={transaction.id} className="flex items-center justify-between rounded-lg bg-nexara-accent/10 p-3">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-nexara-accent" />
                        <div>
                          <p className="font-medium capitalize">{transaction.type} Processing</p>
                          <p className="text-sm text-gray-400">{Math.abs(transaction.amount)} coins - in review</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">Processing</p>
                    </div>
                  ))}
                {transactions.filter(t => t.status === "pending").length === 0 && (
                  <p className="text-center text-gray-400 py-4">No pending actions</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <div 
                      key={transaction.id} 
                      className="flex items-center justify-between border-b border-gray-800 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center mr-3
                          ${transaction.amount > 0 ? 'bg-green-900/20' : 'bg-red-900/20'}
                        `}>
                          {transaction.amount > 0 ? (
                            <ArrowDown className={`h-5 w-5 text-green-500`} />
                          ) : (
                            <ArrowUp className={`h-5 w-5 text-red-500`} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium capitalize">
                            {transaction.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.amount > 0 ? 'text-green-500' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount} coins
                        </p>
                        <p className={`text-xs ${
                          transaction.status === 'completed' 
                            ? 'text-gray-400' 
                            : 'text-yellow-500'
                        }`}>
                          {transaction.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-400 py-4">No transactions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ad Dialog */}
      <Dialog open={showAdDialog} onOpenChange={setShowAdDialog}>
        <DialogContent className="bg-nexara-bg border-nexara-accent neon-border">
          <DialogHeader>
            <DialogTitle className="text-nexara-accent">Watch an Ad</DialogTitle>
            <DialogDescription>Watch this short ad to earn 1 free coin</DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center">
            <div className="w-full h-40 bg-gray-800 flex items-center justify-center mb-4 flex-col">
              <p>Ad would appear here</p>
              <p className="text-gray-500">(Unity Ads integration)</p>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Watch this ad to earn 1 coin. You can earn up to 10 coins per day from ads.
            </p>
            <Button onClick={handleWatchAd} className="game-button">
              I've Watched the Ad
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Welcome Dialog */}
      <Dialog open={showWelcomeDialog} onOpenChange={setShowWelcomeDialog}>
        <DialogContent className="bg-nexara-bg border-nexara-accent neon-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-nexara-accent">Welcome to Nexara BattleField!</DialogTitle>
            <DialogDescription>Your journey begins here</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="font-medium">Getting Started</h3>
              <p className="text-sm text-gray-300">
                Welcome to Nexara BattleField! To get started, you'll need coins to join matches. You can earn coins by:
              </p>
              <ul className="text-sm text-gray-300 space-y-1 list-disc pl-5">
                <li>Watching ads (1 coin per ad)</li>
                <li>Purchasing coin packages</li>
                <li>Winning tournaments</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Join Matches</h3>
              <p className="text-sm text-gray-300">
                Browse available matches and enter tournaments to compete for prizes. Entry fees vary by match type.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Need Help?</h3>
              <p className="text-sm text-gray-300">
                Visit the profile section for support or check notifications for updates about your matches and withdrawals.
              </p>
            </div>
          </div>
          <Button onClick={() => setShowWelcomeDialog(false)} className="w-full game-button">
            Let's Go!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;

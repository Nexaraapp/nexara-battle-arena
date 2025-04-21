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
        // For a new user, start with 0 balance
        let userBalance = 0;
        let userTransactions: Transaction[] = [];
        
        // Get existing transactions for this user
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', userId)
          .order('date', { ascending: false });
        
        if (!transactionError && transactionData && transactionData.length > 0) {
          // Map transactions to the format we need
          userTransactions = transactionData.map((tx: any) => ({
            id: tx.id,
            type: tx.type,
            amount: tx.amount,
            date: tx.date,
            status: tx.status
          }));
          
          // Calculate balance from transactions
          userBalance = transactionData.reduce((total: number, tx: any) => {
            if (tx.status === 'completed') {
              return total + tx.amount;
            }
            return total;
          }, 0);
        }
        
        setWalletBalance(userBalance);
        setTransactions(userTransactions);
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

  const handleWatchAd = async () => {
    // Simulate watching an ad
    setShowAdDialog(false);
    
    try {
      // In a real app, you would call an API to verify the ad was watched
      const coinReward = 1;
      
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to earn coins");
        return;
      }
      
      // Add a transaction record for the ad reward
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          type: "ad_reward",
          amount: coinReward,
          date: new Date().toISOString().split('T')[0],
          status: "completed"
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Update state
      const newTransaction = {
        id: data[0].id,
        type: "ad_reward",
        amount: coinReward,
        date: data[0].date,
        status: "completed"
      };
      
      setWalletBalance((prev) => prev + coinReward);
      setTransactions(prev => [newTransaction, ...prev]);
      
      toast.success("Thanks for watching! 1 coin added to your wallet.");
    } catch (error: any) {
      console.error("Error adding ad reward:", error);
      toast.error("Failed to add coins. Please try again later.");
    }
  };

  const handleBuyCoinPack = async (packageId: number) => {
    const selectedPackage = coinPackages.find(pkg => pkg.id === packageId);
    if (selectedPackage) {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("You must be logged in to buy coins");
          return;
        }
        
        toast.success(`Redirecting to payment for ${selectedPackage.coins} coins`);
        
        // For demo, let's simulate a successful payment after a delay
        setTimeout(async () => {
          try {
            // Create a transaction record for top-up (pending until confirmed by admin)
            const { data, error } = await supabase
              .from('transactions')
              .insert({
                user_id: session.user.id,
                type: "topup",
                amount: selectedPackage.coins,
                date: new Date().toISOString().split('T')[0],
                status: "pending" // Will be set to completed after admin approval
              })
              .select();
            
            if (error) {
              throw error;
            }
            
            // Add to transactions state
            const newTransaction = {
              id: data[0].id,
              type: "topup",
              amount: selectedPackage.coins,
              date: data[0].date,
              status: "pending"
            };
            
            setTransactions(prev => [newTransaction, ...prev]);
            toast.success(`Top-up request submitted. Coins will be added after admin approval.`);
          } catch (error: any) {
            console.error("Error recording top-up transaction:", error);
            toast.error("Failed to submit top-up. Please try again later.");
          }
        }, 1500);
      } catch (error: any) {
        console.error("Error handling coin pack purchase:", error);
        toast.error("Failed to process purchase. Please try again later.");
      }
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
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
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to withdraw coins");
        return;
      }
      
      // Create a transaction record for withdrawal (pending)
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          type: "withdrawal",
          amount: -amount, // Negative amount for withdrawals
          date: new Date().toISOString().split('T')[0],
          status: "pending" // Will be updated by admin/superadmin
        })
        .select();
      
      if (error) {
        throw error;
      }
      
      // Add to transactions state
      const newTransaction = {
        id: data[0].id,
        type: "withdrawal",
        amount: -amount,
        date: data[0].date,
        status: "pending"
      };
      
      setTransactions(prev => [newTransaction, ...prev]);
      toast.success(`Withdrawal request for ${amount} coins submitted. Upload payment QR.`);
      setWithdrawAmount("");
    } catch (error: any) {
      console.error("Error submitting withdrawal:", error);
      toast.error("Failed to submit withdrawal. Please try again later.");
    }
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
                      .filter(t => t.amount > 0 && t.status === 'completed')
                      .reduce((sum, t) => sum + t.amount, 0)} coins
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-medium">
                    {Math.abs(transactions
                      .filter(t => t.amount < 0 && t.type !== "withdrawal" && t.status === 'completed')
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
                      .filter(t => t.type === "ad_reward" && t.status === 'completed')
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

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IndianRupee, Loader, CircleArrowUp, CircleArrowDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [topupAmount, setTopupAmount] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [isLoadingBalance, setIsLoadingBalance] = useState(true);
  const [isProcessingWithdrawal, setIsProcessingWithdrawal] = useState(false);
  const [isProcessingTopup, setIsProcessingTopup] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("balance");
  const [withdrawalMsg, setWithdrawalMsg] = useState("");
  
  const qrCodeUrl = "/lovable-uploads/50e5f998-8ecf-493d-aded-3c24db032cf0.png";
  
  useEffect(() => {
    fetchWalletData();
    
    const channel = supabase
      .channel('wallet-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transactions',
          filter: `user_id=eq.${getCurrentUserId()}` 
        }, 
        () => {
          fetchWalletData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const getCurrentUserId = () => {
    return supabase.auth.getSession().then(({ data }) => {
      return data?.session?.user?.id;
    });
  };

  const fetchWalletData = async () => {
    setIsLoadingBalance(true);
    
    try {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      
      if (!session) {
        toast.error("Please log in to access your wallet");
        setIsLoadingBalance(false);
        return;
      }
      
      const userId = session.user.id;
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
        
      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        toast.error("Failed to load transaction history");
      } else {
        setTransactions(transactionsData || []);
      }
      
      let calculatedBalance = 0;
      if (transactionsData) {
        calculatedBalance = transactionsData.reduce((total, tx) => {
          return total + (tx.amount || 0);
        }, 0);
      }
      
      setBalance(calculatedBalance);
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      toast.error("Failed to load wallet data");
    } finally {
      setIsLoadingBalance(false);
    }
  };
  
  const handleTopupRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const topupAmountInt = parseInt(topupAmount);
    if (isNaN(topupAmountInt) || topupAmountInt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (!utrNumber) {
      toast.error("Please enter UTR number for verification");
      return;
    }
    
    setIsProcessingTopup(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to request a top-up");
        setIsProcessingTopup(false);
        return;
      }
      
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          type: 'topup_request',
          amount: topupAmountInt,
          status: 'pending',
          date: new Date().toISOString().split('T')[0],
          notes: `Topup request. UTR: ${utrNumber}`
        });
        
      if (error) {
        console.error("Error creating top-up request:", error);
        throw new Error("Failed to create top-up request");
      }
      
      toast.success("Top-up request submitted. It will be processed by an admin soon.");
      setTopupAmount("");
      setUtrNumber("");
      setActiveTab("balance");
    } catch (error: any) {
      console.error("Error processing top-up request:", error);
      toast.error(error.message || "Failed to process top-up request");
    } finally {
      setIsProcessingTopup(false);
    }
  };
  
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const withdrawalAmountInt = parseInt(withdrawalAmount);
    if (isNaN(withdrawalAmountInt) || withdrawalAmountInt <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    if (withdrawalAmountInt > balance) {
      toast.error("Insufficient balance for this withdrawal");
      return;
    }
    
    if (!withdrawalMsg) {
      toast.error("Please enter your UPI ID for payment");
      return;
    }
    
    setIsProcessingWithdrawal(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please log in to request a withdrawal");
        setIsProcessingWithdrawal(false);
        return;
      }
      
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: session.user.id,
          amount: withdrawalAmountInt,
          status: 'pending',
          created_at: new Date().toISOString()
        });
        
      if (withdrawalError) {
        console.error("Error creating withdrawal request:", withdrawalError);
        throw new Error("Failed to create withdrawal request");
      }
      
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: session.user.id,
          type: 'withdrawal_request',
          amount: -withdrawalAmountInt,
          status: 'pending',
          date: new Date().toISOString().split('T')[0],
          notes: `Withdrawal request. UPI: ${withdrawalMsg}`
        });
        
      if (transactionError) {
        console.error("Error creating withdrawal transaction:", transactionError);
        throw new Error("Failed to record withdrawal request");
      }
      
      toast.success("Withdrawal request submitted. It will be processed by an admin soon.");
      setWithdrawalAmount("");
      setWithdrawalMsg("");
      setActiveTab("balance");
    } catch (error: any) {
      console.error("Error processing withdrawal:", error);
      toast.error(error.message || "Failed to process withdrawal request");
    } finally {
      setIsProcessingWithdrawal(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>
      
      <Tabs defaultValue="balance" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="balance">Balance</TabsTrigger>
          <TabsTrigger value="topup">Top Up</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
        </TabsList>
        
        <TabsContent value="balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Balance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isLoadingBalance ? (
                <div className="py-8 flex justify-center">
                  <Loader className="h-8 w-8 animate-spin text-nexara-accent" />
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="text-4xl font-bold mb-2">{balance}</div>
                  <div className="text-gray-400">Coins Available</div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <h2 className="text-xl font-bold mt-6">Transaction History</h2>
          
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex items-center">
                      <div className={`p-4 ${transaction.amount > 0 ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                        {transaction.amount > 0 ? (
                          <CircleArrowUp className="h-6 w-6 text-green-500" />
                        ) : (
                          <CircleArrowDown className="h-6 w-6 text-red-500" />
                        )}
                      </div>
                      <div className="p-4 flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {transaction.type === 'match_entry' && 'Match Entry Fee'}
                              {transaction.type === 'match_reward' && 'Match Reward'}
                              {transaction.type === 'admin_reward' && 'Admin Bonus'}
                              {transaction.type === 'topup_request' && 'Top-up Request'}
                              {transaction.type === 'withdrawal_request' && 'Withdrawal Request'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {transaction.date && (
                                <>{formatDistanceToNow(new Date(transaction.date))} ago</>
                              )}
                            </div>
                          </div>
                          <div className={`font-semibold ${transaction.amount > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} coins
                          </div>
                        </div>
                        {transaction.notes && (
                          <div className="text-sm text-gray-400 mt-1">
                            {transaction.notes}
                          </div>
                        )}
                        {transaction.status === 'pending' && (
                          <div className="text-sm text-yellow-500 mt-1">
                            Pending approval
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-gray-400 mb-2">No transactions yet</div>
                <p>Complete matches or top up your wallet to see your transaction history.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="topup">
          <Card>
            <CardHeader>
              <CardTitle>Add Coins to Your Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTopupRequest} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (in coins)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                    placeholder="Enter amount to add"
                    className="bg-muted"
                  />
                </div>
                
                <div>
                  <Label className="block mb-2">Scan QR Code to Pay</Label>
                  <div className="bg-white p-4 rounded-md mb-4 flex justify-center">
                    <img
                      src={qrCodeUrl}
                      alt="Payment QR Code"
                      className="max-h-64 object-contain"
                    />
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-sm text-gray-400 mb-1">Send payment via UPI to this QR code</p>
                    <div className="flex justify-center items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      <p className="text-nexara-accent font-medium">nexarabf@ybl</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="utr">UTR Number / Reference ID</Label>
                  <Input
                    id="utr"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter payment reference ID"
                    className="bg-muted"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter the UTR/Reference number from your payment app for verification
                  </p>
                </div>
                
                <Button 
                  type="submit"
                  disabled={isProcessingTopup}
                  className="w-full game-button"
                >
                  {isProcessingTopup ? "Processing..." : "Submit Top-up Request"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="withdraw">
          <Card>
            <CardHeader>
              <CardTitle>Withdraw Coins</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                <div className="bg-nexara-accent/10 p-4 rounded-md mb-2">
                  <p className="font-medium">Available Balance: {balance} coins</p>
                </div>
                
                <div>
                  <Label htmlFor="withdraw-amount">Amount (in coins)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    className="bg-muted"
                  />
                </div>
                
                <div>
                  <Label htmlFor="withdraw-upi">UPI ID for payment</Label>
                  <Input
                    id="withdraw-upi"
                    value={withdrawalMsg}
                    onChange={(e) => setWithdrawalMsg(e.target.value)}
                    placeholder="Enter your UPI ID (e.g. name@upi)"
                    className="bg-muted"
                  />
                </div>
                
                <Button 
                  type="submit"
                  disabled={isProcessingWithdrawal || balance <= 0}
                  className="w-full game-button"
                >
                  {isProcessingWithdrawal ? "Processing..." : "Request Withdrawal"}
                </Button>
                
                <p className="text-xs text-gray-400 text-center">
                  Withdrawals are processed within 24 hours after admin approval
                </p>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Wallet;

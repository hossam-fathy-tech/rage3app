import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Wallet, CreditCard, ArrowUpRight, History, Loader2, Gift } from "lucide-react";
import Header from "@/components/layout/Header";

const WalletPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [rechargeCode, setRechargeCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [recharging, setRecharging] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    loadWallet();
  }, [user]);

  const loadWallet = async () => {
    setLoading(true);
    
    // Load balance
    const { data: wallet } = await supabase
      .from("user_wallets")
      .select("balance")
      .eq("user_id", user?.id)
      .maybeSingle();
    
    setBalance(wallet?.balance || 0);

    // Load transactions
    const { data: txns } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(20);
    
    setTransactions(txns || []);
    setLoading(false);
  };

  const handleRecharge = async () => {
    if (!rechargeCode.trim()) {
      toast.error("أدخل كود الشحن");
      return;
    }

    setRecharging(true);
    
    const { data: code, error: codeError } = await supabase
      .from("recharge_codes")
      .select("*")
      .eq("code", rechargeCode.trim().toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (codeError || !code) {
      toast.error("كود غير صحيح");
      setRecharging(false);
      return;
    }

    if (code.uses_limit > 0 && code.uses_count >= code.uses_limit) {
      toast.error("الكود منتهي الاستخدام");
      setRecharging(false);
      return;
    }

    // Update wallet
    const newBalance = balance + code.amount;
    
    const { error: walletError } = await supabase
      .from("user_wallets")
      .upsert({ user_id: user?.id, balance: newBalance });

    if (walletError) {
      toast.error("حدث خطأ");
      setRecharging(false);
      return;
    }

    // Record transaction
    await supabase.from("wallet_transactions").insert({
      user_id: user?.id,
      amount: code.amount,
      type: "credit",
      description: `شحن بكود: ${code.code}`
    });

    // Update code usage
    await supabase
      .from("recharge_codes")
      .update({ uses_count: code.uses_count + 1 })
      .eq("id", code.id);

    toast.success(`تم شحن ${code.amount} جنيه بنجاح!`);
    setRechargeCode("");
    loadWallet();
    setRecharging(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Header />
      <div className="lg:mr-[260px] px-4 md:px-8 pt-16 pb-24 lg:pb-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">المحفظة</h1>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-white mb-8 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">الرصيد الحالي</p>
              <p className="text-4xl font-bold">{balance} جنيه</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
              <Wallet className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Recharge Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            شحن الرصيد
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={rechargeCode}
              onChange={(e) => setRechargeCode(e.target.value.toUpperCase())}
              placeholder="أدخل كود الشحن"
              className="flex-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              dir="ltr"
            />
            <button
              onClick={handleRecharge}
              disabled={recharging}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2"
            >
              {recharging ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5" />}
              شحن
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            سجل المعاملات
          </h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد معاملات بعد</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${txn.type === 'credit' ? 'bg-primary/10 text-primary' : 'bg-red-100 text-red-600'}`}>
                      {txn.type === 'credit' ? <Gift className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{txn.description}</p>
                      <p className="text-xs text-gray-500">{new Date(txn.created_at).toLocaleDateString("ar")}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${txn.type === 'credit' ? 'text-primary' : 'text-red-600'}`}>
                    {txn.type === 'credit' ? '+' : '-'}{txn.amount} جنيه
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default WalletPage;

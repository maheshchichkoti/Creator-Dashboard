import React, { useState } from 'react';
import apiClient from '../services/apiClient';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext'; // Import useAuth to update credits locally

function SpendCredits() {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, updateUserCredits } = useAuth(); // Get user credits and update function

  const handleSpend = async (e) => {
    e.preventDefault(); // Use form submission
    const numericAmount = parseInt(amount, 10);

    // Basic client-side validation
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Please enter a valid positive amount.");
      return;
    }
    if (!purpose.trim()) {
      toast.error("Please enter a purpose for spending credits.");
      return;
    }
    if (user && numericAmount > user.credits) {
      toast.error("You don't have enough credits.");
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      // Send amount (as number) and purpose
      const res = await apiClient.post('/user/spend-credits', { amount: numericAmount, purpose });
      toast.success(res.data.message || 'Credits spent successfully!');

      // Update credits in AuthContext
      updateUserCredits(res.data.credits); // Use the new credit amount from backend response

      // Clear the form
      setAmount('');
      setPurpose('');
    } catch (err) {
      console.error('Failed to spend credits:', err);
      toast.error(err.response?.data?.message || 'Failed to spend credits.');
      // Error toast might be shown by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Spend Your Credits</h1>
      <p className="mb-4 text-lg">Your current balance: <span className="font-bold text-blue-600">{user?.credits ?? 'Loading...'}</span> credits</p>
      <form onSubmit={handleSpend} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount to Spend:</label>
          <input
            id="amount"
            type="number"
            placeholder="e.g., 50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">Purpose:</label>
          <input
            id="purpose"
            type="text"
            placeholder="e.g., Unlock premium feature"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50"
        >
          {isLoading ? 'Processing...' : 'Spend Credits'}
        </button>
      </form>
    </div>
  );
}

export default SpendCredits;
import React from 'react'
import Link from 'next/link'

export default function ExpensesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <nav className="flex space-x-4">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/expenses" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Expenses
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card card-hover">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Expenses (YTD)</h3>
            <p className="text-3xl font-bold text-gray-900">$45,230</p>
            <p className="text-sm text-gray-600 mt-1">January - February 2026</p>
          </div>
          
          <div className="card card-hover">
            <h3 className="text-sm font-medium text-gray-500 mb-2">This Month</h3>
            <p className="text-3xl font-bold text-gray-900">$12,450</p>
            <p className="text-sm text-green-600 mt-1">$3,200 under budget</p>
          </div>
          
          <div className="card card-hover">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Approval</h3>
            <p className="text-3xl font-bold text-gray-900">$2,850</p>
            <p className="text-sm text-yellow-600 mt-1">8 expenses pending</p>
          </div>
        </div>

        {/* Expense Chart */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Expense Trends</h2>
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p>Expense trend chart will be rendered here</p>
          </div>
        </div>

        {/* Expense Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h2>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Category pie chart will be rendered here</p>
            </div>
          </div>
          
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h2>
            <div className="space-y-4">
              {[
                { category: 'Medical', amount: 15200, percentage: 34, color: 'bg-red-500' },
                { category: 'Education', amount: 8900, percentage: 20, color: 'bg-blue-500' },
                { category: 'Housing', amount: 7200, percentage: 16, color: 'bg-green-500' },
                { category: 'Transportation', amount: 4500, percentage: 10, color: 'bg-yellow-500' },
                { category: 'Food', amount: 3800, percentage: 8, color: 'bg-purple-500' },
                { category: 'Other', amount: 5630, percentage: 12, color: 'bg-gray-500' },
              ].map((item) => (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.category}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">${item.amount.toLocaleString()}</span>
                      <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${item.color} h-2 rounded-full`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Expenses Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Expenses</h2>
            <button className="btn-primary text-sm">Add Expense</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="table-header">Date</th>
                  <th className="table-header">Description</th>
                  <th className="table-header">Category</th>
                  <th className="table-header">Amount</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Payment Method</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="table-cell">Feb 25, 2026</td>
                  <td className="table-cell">Dr. Smith Medical Consultation</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                      Medical
                    </span>
                  </td>
                  <td className="table-cell font-medium">$250.00</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Approved
                    </span>
                  </td>
                  <td className="table-cell">Credit Card</td>
                </tr>
                <tr>
                  <td className="table-cell">Feb 23, 2026</td>
                  <td className="table-cell">School Supplies</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Education
                    </span>
                  </td>
                  <td className="table-cell font-medium">$125.50</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Paid
                    </span>
                  </td>
                  <td className="table-cell">Debit Card</td>
                </tr>
                <tr>
                  <td className="table-cell">Feb 20, 2026</td>
                  <td className="table-cell">Monthly Rent Payment</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Housing
                    </span>
                  </td>
                  <td className="table-cell font-medium">$1,200.00</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Paid
                    </span>
                  </td>
                  <td className="table-cell">Bank Transfer</td>
                </tr>
                <tr>
                  <td className="table-cell">Feb 18, 2026</td>
                  <td className="table-cell">Transportation to Therapy</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Transportation
                    </span>
                  </td>
                  <td className="table-cell font-medium">$45.00</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </td>
                  <td className="table-cell">Cash</td>
                </tr>
                <tr>
                  <td className="table-cell">Feb 15, 2026</td>
                  <td className="table-cell">Grocery Shopping</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                      Food
                    </span>
                  </td>
                  <td className="table-cell font-medium">$180.75</td>
                  <td className="table-cell">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Paid
                    </span>
                  </td>
                  <td className="table-cell">Credit Card</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">Showing 5 of 48 expenses</p>
            <div className="flex space-x-2">
              <button className="btn-secondary text-sm">Previous</button>
              <button className="btn-secondary text-sm">Next</button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © 2026 Custody Dashboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
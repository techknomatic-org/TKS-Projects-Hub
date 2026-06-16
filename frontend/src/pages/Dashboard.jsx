import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService.js';
import { authService } from '../services/authService.js';
import Sidebar from '../components/Sidebar.jsx';
import Header from '../components/Header.jsx';
import ProductSelector from '../components/ProductSelector.jsx';
import KanbanBoard from '../components/KanbanBoard.jsx';
import FeatureList from '../components/FeatureList.jsx';
import UserStoryList from '../components/UserStoryList.jsx';
import ReportsDashboard from '../components/ReportsDashboard.jsx';
import AuditLogList from '../components/AuditLogList.jsx';
import NotificationsList from '../components/NotificationsList.jsx';
import OfflineIndicator from '../components/OfflineIndicator.jsx';
import RequirementsMappingList from '../components/RequirementsMappingList.jsx';
import MembersList from '../components/MembersList.jsx';
import { Hourglass, Layout, ListTodo, ShieldAlert } from 'lucide-react';

const Dashboard = () => {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState('STATUS'); // STATUS, FEATURE_LIST, USER_STORY
  const [errorMsg, setErrorMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = authService.getUser();

  const handleSetSelectedProduct = (product) => {
    setSelectedProduct(product);
    if (product) {
      localStorage.setItem('tks_selected_product_id', product.id);
    } else {
      localStorage.removeItem('tks_selected_product_id');
    }
  };

  // Fetch all products from the backend on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      setErrorMsg('');
      try {
        const data = await productService.getProducts();
        setProducts(data);
        if (data.length > 0) {
          const savedProductId = localStorage.getItem('tks_selected_product_id');
          const found = data.find(p => p.id === savedProductId);
          if (found) {
            setSelectedProduct(found);
          } else {
            setSelectedProduct(data[0]);
            localStorage.setItem('tks_selected_product_id', data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load products:', err);
        setErrorMsg('Failed to load products list from the database.');
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar - Navigation panel on Left */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area on Right */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header - Center title & user profile dropdown */}
        <Header setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Scrollable Page Wrapper */}
        <main className="flex-1 overflow-y-auto pt-2 px-8 pb-8 space-y-4">
          
          {/* Global error notifications */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Product Dropdown Selector Bar (shared across views) */}
          <ProductSelector 
            products={products}
            selectedProduct={selectedProduct}
            setSelectedProduct={handleSetSelectedProduct}
            loading={loadingProducts}
            onProductCreated={(newProd) => {
              setProducts(prev => [...prev, newProd]);
              handleSetSelectedProduct(newProd);
            }}
            onProductDeleted={(deletedId) => {
              setProducts(prev => {
                const filtered = prev.filter(p => p.id !== deletedId);
                if (filtered.length > 0) {
                  handleSetSelectedProduct(filtered[0]);
                } else {
                  handleSetSelectedProduct(null);
                }
                return filtered;
              });
            }}
          />

          {/* Active Tab Views Switcher */}
          {activeTab === 'STATUS' ? (
            /* Kanban Board status view */
            selectedProduct ? (
              <KanbanBoard selectedProduct={selectedProduct} />
            ) : (
              !loadingProducts && (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-medium">
                  Please select a product to display its status board.
                </div>
              )
            )
          ) : activeTab === 'FEATURE_LIST' ? (
            /* Feature List Module */
            selectedProduct ? (
              <FeatureList selectedProduct={selectedProduct} userRole={user?.role} />
            ) : (
              !loadingProducts && (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-medium">
                  Please select a product to display its features list.
                </div>
              )
            )
          ) : activeTab === 'USER_STORY' ? (
            /* User Story Module */
            selectedProduct ? (
              <UserStoryList selectedProduct={selectedProduct} userRole={user?.role} />
            ) : (
              !loadingProducts && (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-medium">
                  Please select a product to display its user stories.
                </div>
              )
            )
          ) : activeTab === 'REQUIREMENTS_MAPPING' ? (
            /* Requirements Mapping Module */
            selectedProduct ? (
              <RequirementsMappingList selectedProduct={selectedProduct} userRole={user?.role} />
            ) : (
              !loadingProducts && (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-medium">
                  Please select a product to display its requirements mapping.
                </div>
              )
            )
          ) : activeTab === 'REPORTS' ? (
            /* Reports & Analytics Module */
            selectedProduct ? (
              <ReportsDashboard selectedProduct={selectedProduct} />
            ) : (
              !loadingProducts && (
                <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-medium">
                  Please select a product to display reports.
                </div>
              )
            )
          ) : activeTab === 'MEMBERS' ? (
            /* Members Management Module */
            <MembersList userRole={user?.role} />
          ) : activeTab === 'AUDIT_LOGS' ? (
            /* Audit Logs Module */
            <AuditLogList />
          ) : activeTab === 'NOTIFICATIONS' ? (
            /* Notifications Module */
            <NotificationsList />
          ) : (
            /* Fallback or other tabs placeholder */
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm text-slate-400 font-medium">
              Coming Soon
            </div>
          )}
        </main>
      </div>

      {/* Offline connectivity indicator banner */}
      <OfflineIndicator />


    </div>
  );
};

export default Dashboard;



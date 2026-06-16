import React, { useState } from 'react';
import { Download, Layers, X, Plus, FolderKanban, Trash2, ShieldAlert } from 'lucide-react';
import { authService } from '../services/authService.js';
import { productService } from '../services/productService.js';

const ProductSelector = ({ 
  products = [], 
  selectedProduct = null, 
  setSelectedProduct = () => {}, 
  loading = false,
  onProductCreated = () => {},
  onProductDeleted = () => {}
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const user = authService.getUser();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'BOTH';

  const handleExport = () => {
    // Optional export placeholder trigger
    alert('Exporting status board report...');
  };

  const handleSelectChange = (e) => {
    const value = e.target.value;
    if (value === 'ADD_NEW_PRODUCT') {
      setIsModalOpen(true);
      setErrorMsg('');
      setNewProductName('');
      setNewProductDesc('');
      // Force dropdown select to show the currently selected product
      e.target.value = selectedProduct?.id || '';
    } else if (value === 'DELETE_PRODUCT') {
      setErrorMsg('');
      setIsDeleteModalOpen(true);
      // Force dropdown select to show the currently selected product
      e.target.value = selectedProduct?.id || '';
    } else {
      const found = products.find(p => p.id === value);
      if (found) setSelectedProduct(found);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    setIsCreating(true);
    setErrorMsg('');

    try {
      const newProd = await productService.createProduct({
        name: newProductName.trim(),
        description: newProductDesc.trim() || undefined
      });
      onProductCreated(newProd);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to create product:', err);
      setErrorMsg(err.message || 'Failed to create product.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setIsDeleting(true);
    setErrorMsg('');
    try {
      await productService.deleteProduct(selectedProduct.id);
      setIsDeleteModalOpen(false);
      onProductDeleted(selectedProduct.id);
    } catch (err) {
      console.error('Failed to delete product:', err);
      setErrorMsg(err.message || 'Failed to delete product.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl py-3 px-5 border border-slate-100 shadow-xs flex flex-row items-center justify-between gap-4 w-full animate-in fade-in slide-in-from-top-3 duration-200">
        {/* Selector Dropdown on Left */}
        <div className="flex items-center gap-3">
          <label className="hidden sm:block text-xs font-bold text-slate-400 uppercase tracking-wider select-none shrink-0">
            Select Product:
          </label>
          
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              {loading ? (
                <div className="w-full py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 text-xs flex items-center gap-2">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                  Loading...
                </div>
              ) : (
                <select
                  value={selectedProduct?.id || ''}
                  onChange={handleSelectChange}
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl py-2 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer appearance-none font-sans"
                >
                  {products.length === 0 ? (
                    <option value="">No products found</option>
                  ) : (
                    products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))
                  )}
                  {isAdmin && (
                    <option value="ADD_NEW_PRODUCT" className="text-blue-600 font-bold bg-blue-50">
                      + Add New Product...
                    </option>
                  )}
                  {isAdmin && selectedProduct && (
                    <option value="DELETE_PRODUCT" className="text-red-600 font-bold bg-red-50">
                      🗑️ Delete Current Product...
                    </option>
                  )}
                </select>
              )}

              {/* Custom Select Dropdown Arrow */}
              {!loading && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                  <svg className="fill-current h-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Export Action on Right */}
        <button
          onClick={handleExport}
          disabled={loading || !selectedProduct}
          className="flex items-center gap-1.5 py-2 px-4 border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 rounded-xl font-bold text-slate-700 text-xs shadow-xs transition-all duration-150 shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed justify-center font-sans"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Export</span>
        </button>
      </div>

      {/* New Product Modal overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Dark Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !isCreating && setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-premium border border-slate-100 p-8 flex flex-col z-10 animate-in zoom-in-95 duration-150">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 font-sans">
                <FolderKanban className="w-5 h-5 text-blue-600" />
                Add New Product
              </h2>
              <button 
                onClick={() => !isCreating && setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error message */}
            {errorMsg && (
              <div className="p-3.5 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150 font-sans">
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateProduct} className="space-y-5 font-sans">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Product Name
                </label>
                <input 
                  type="text" 
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  disabled={isCreating}
                  required
                  placeholder="e.g. Nexora Analytics Workspace"
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Description (Optional)
                </label>
                <textarea 
                  rows="3"
                  value={newProductDesc}
                  onChange={(e) => setNewProductDesc(e.target.value)}
                  disabled={isCreating}
                  placeholder="Provide a brief description of the product's scope..."
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl py-3 px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  className="px-5 py-2.5 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 font-bold text-sm bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={isCreating || !newProductName.trim()}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-white font-bold text-sm bg-blue-600 hover:bg-blue-700 transition-all cursor-pointer shadow-md shadow-blue-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Product
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          />

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-premium border border-slate-100 p-8 flex flex-col z-10 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Delete Product</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to delete <strong className="text-slate-800">{selectedProduct?.name}</strong>? 
              <br /><br />
              <span className="text-red-500 font-bold">Warning:</span> This action is permanent and will cascade delete all status tasks, features, user stories, requirements, and mapping records associated with this product.
            </p>

            {/* Error message inside modal */}
            {errorMsg && (
              <div className="p-3 mb-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs bg-white hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-white font-bold text-xs bg-red-600 hover:bg-red-700 transition-all cursor-pointer shadow-md shadow-red-600/10 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductSelector;

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import ProductCatalog from './ProductCatalog';
import LinkGenerator from './LinkGenerator';
import PerformanceDashboard from './PerformanceDashboard';
import { getKolStatus } from '../../../services/kolService';
import './KolDashboard.scss';

/**
 * KOL Dashboard Component
 * Main dashboard for approved KOLs to manage their affiliate activities
 */
const KolDashboard = () => {
    const [activeTab, setActiveTab] = useState('products');
    const [kolStatus, setKolStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Check if user is logged in
    const isLoggedIn = () => {
        const userData = localStorage.getItem('userData');
        return !!userData;
    };

    // Fetch KOL status on component mount
    useEffect(() => {
        const fetchKolStatus = async () => {
            try {
                const response = await getKolStatus();
                setKolStatus(response.data);
            } catch (error) {
                console.error('Lỗi khi tải trạng thái KOL:', error);
            } finally {
                setLoading(false);
            }
        };

        if (isLoggedIn()) {
            fetchKolStatus();
        } else {
            setLoading(false);
        }
    }, []);

    // Redirect to login if not logged in
    if (!isLoggedIn()) {
        return <Navigate to="/login" />;
    }

    // Show loading state
    if (loading) {
        return (
            <div className="kol-dashboard-loading">
                <div className="spinner-border" role="status">
                    <span className="sr-only">Đang tải...</span>
                </div>
            </div>
        );
    }

    // Redirect if not approved KOL
    if (!kolStatus || kolStatus.status !== 'approved') {
        return <Navigate to="/user/kol/status" />;
    }

    // Handle product selection for link generation
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setActiveTab('links');
    };

    return (
        <div className="kol-dashboard">
            <div className="container">
                <div className="row">
                    <div className="col-12">
                        <div className="kol-dashboard-header">
                            <h2>Bảng điều khiển KOL</h2>
                            <p>Chào mừng trở lại! Quản lý liên kết affiliate và theo dõi hiệu suất của bạn.</p>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="kol-dashboard-tabs">
                            <ul className="nav nav-tabs">
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('products')}
                                    >
                                        Danh mục sản phẩm
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'links' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('links')}
                                    >
                                        Tạo liên kết
                                    </button>
                                </li>
                                <li className="nav-item">
                                    <button 
                                        className={`nav-link ${activeTab === 'performance' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('performance')}
                                    >
                                        Hiệu suất
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="kol-dashboard-content">
                            {activeTab === 'products' && (
                                <ProductCatalog onProductSelect={handleProductSelect} />
                            )}
                            {activeTab === 'links' && (
                                <LinkGenerator selectedProduct={selectedProduct} />
                            )}
                            {activeTab === 'performance' && (
                                <PerformanceDashboard />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KolDashboard;
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getProductDetailByShortCode } from '../../services/affiliateService';
import { storeAffiliateAttribution } from '../../utils/affiliateUtils';
import './AffiliateRedirect.scss';

/**
 * Affiliate Redirect Component
 * Handles short code affiliate links and redirects to product detail page
 */
const AffiliateRedirect = () => {
    const { shortCode } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const hasProcessedRef = useRef(false);

    useEffect(() => {
        const handleAffiliateRedirect = async () => {
            // Prevent duplicate processing
            if (hasProcessedRef.current) {
                return;
            }
            
            try {
                hasProcessedRef.current = true;
                setLoading(true);
                setError(null);

                // Call API to get product details and track the click
                const response = await getProductDetailByShortCode(shortCode);
                
                if (response.errCode === 0 && response.data) {
                    const { product, affiliateData } = response.data;
                    
                    // Store affiliate attribution data
                    if (affiliateData) {
                        storeAffiliateAttribution(
                            affiliateData.kolId,
                            affiliateData.affiliateId,
                            product.id,
                            shortCode
                        );
                    }
                    
                    // Redirect to product detail page with affiliate parameters
                    const affiliateParams = new URLSearchParams();
                    if (affiliateData?.kolId) affiliateParams.append('ref', affiliateData.kolId);
                    if (affiliateData?.affiliateId) affiliateParams.append('aff', affiliateData.affiliateId);
                    if (shortCode) affiliateParams.append('utm_campaign', shortCode);
                    affiliateParams.append('utm_source', 'affiliate');
                    affiliateParams.append('utm_medium', 'kol');
                    
                    const redirectUrl = `/detail-product/${product.id}?${affiliateParams.toString()}`;
                    window.location.href = redirectUrl;
                } else {
                    setError('Affiliate link không hợp lệ hoặc đã hết hạn');
                }
            } catch (error) {
                console.error('Error handling affiliate redirect:', error);
                setError('Không thể xử lý liên kết affiliate. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        if (shortCode && !hasProcessedRef.current) {
            handleAffiliateRedirect();
        }
    }, [shortCode]);

    if (loading) {
        return (
            <div className="affiliate-redirect-container">
                <div className="loading-content">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Đang tải...</span>
                    </div>
                    <p className="loading-text">Đang chuyển hướng đến sản phẩm...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="affiliate-redirect-container">
                <div className="error-content">
                    <div className="error-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3 className="error-title">Liên kết không hợp lệ</h3>
                    <p className="error-message">{error}</p>
                    <button 
                        className="btn btn-primary"
                        onClick={() => window.location.href = '/'}
                    >
                        Về trang chủ
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default AffiliateRedirect; 
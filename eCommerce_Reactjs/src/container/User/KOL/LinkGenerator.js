import React, { useState, useEffect } from 'react';
import { generateAffiliateLink, getAffiliateLinks } from '../../../services/affiliateService';
import CommonUtils from '../../../utils/CommonUtils';
import './LinkGenerator.scss';

/**
 * Link Generator Component
 * Interface for KOLs to generate affiliate links and manage existing links
 */
const LinkGenerator = ({ selectedProduct }) => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [copiedLinkId, setCopiedLinkId] = useState(null);

    const ITEMS_PER_PAGE = 10;

    // Fetch existing affiliate links
    const fetchLinks = async (page = 1) => {
        try {
            setLoading(true);
            const response = await getAffiliateLinks({ page, limit: ITEMS_PER_PAGE });
            
            if (response.errCode === 0) {
                setLinks(response.data.links || []);
                setTotalPages(response.data.pagination?.totalPages || 1);
            } else {
                setError(response.errMessage || 'Không thể tải danh sách liên kết affiliate');
            }
        } catch (error) {
            console.error('Lỗi khi tải liên kết affiliate:', error);
            setError('Không thể tải liên kết affiliate. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    // Load links on component mount
    useEffect(() => {
        fetchLinks();
    }, []);

    // Generate new affiliate link
    const handleGenerateLink = async (product) => {
        try {
            setGenerating(true);
            setError(null);
            setSuccess(null);

            const response = await generateAffiliateLink({ productId: product.id });
            
            if (response.errCode === 0) {
                setSuccess(`Đã tạo thành công liên kết affiliate cho ${product.name}!`);
                // Refresh the links list
                fetchLinks(currentPage);
            } else {
                setError(response.errMessage || 'Không thể tạo liên kết affiliate');
            }
        } catch (error) {
            console.error('Lỗi khi tạo liên kết affiliate:', error);
            setError('Không thể tạo liên kết affiliate. Vui lòng thử lại.');
        } finally {
            setGenerating(false);
        }
    };

    // Copy link to clipboard
    const handleCopyLink = async (link, urlType = 'original') => {
        const urlToCopy = urlType === 'short' ? link.shortUrl : link.originalUrl;
        const linkId = `${link.id}-${urlType}`;
        
        try {
            await navigator.clipboard.writeText(urlToCopy);
            setCopiedLinkId(linkId);
            setTimeout(() => setCopiedLinkId(null), 2000);
        } catch (error) {
            console.error('Không thể sao chép liên kết:', error);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = urlToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setCopiedLinkId(linkId);
            setTimeout(() => setCopiedLinkId(null), 2000);
        }
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchLinks(page);
    };

    // Render pagination
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // Previous button
        if (currentPage > 1) {
            pages.push(
                <li key="prev" className="page-item">
                    <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        Trước
                    </button>
                </li>
            );
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
                    <button 
                        className="page-link" 
                        onClick={() => handlePageChange(i)}
                    >
                        {i}
                    </button>
                </li>
            );
        }

        // Next button
        if (currentPage < totalPages) {
            pages.push(
                <li key="next" className="page-item">
                    <button 
                        className="page-link" 
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        Tiếp
                    </button>
                </li>
            );
        }

        return (
            <nav>
                <ul className="pagination justify-content-center">
                    {pages}
                </ul>
            </nav>
        );
    };

    return (
        <div className="link-generator">
            <div className="generator-header">
                <h3>Trình tạo liên kết Affiliate</h3>
                <p>Tạo và quản lý liên kết affiliate để bắt đầu kiếm hoa hồng.</p>
            </div>

            {/* Selected Product Section */}
            {selectedProduct && (
                <div className="selected-product-section">
                    <div className="card">
                        <div className="card-body">
                            <h5 className="card-title">Tạo liên kết cho sản phẩm đã chọn</h5>
                            <div className="row align-items-center">
                                <div className="col-md-2">
                                    <img 
                                        src={selectedProduct.image || '/default-product.jpg'} 
                                        alt={selectedProduct.name}
                                        className="img-fluid rounded"
                                    />
                                </div>
                                <div className="col-md-7">
                                    <h6 className="mb-2">{selectedProduct.name}</h6>
                                    <div className="product-price">
                                        {selectedProduct.discountPrice && selectedProduct.discountPrice < selectedProduct.price ? (
                                            <>
                                                <span className="current-price me-2">
                                                    {CommonUtils.formatter.format(selectedProduct.discountPrice)}
                                                </span>
                                                <span className="original-price">
                                                    {CommonUtils.formatter.format(selectedProduct.price)}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="current-price">
                                                {CommonUtils.formatter.format(selectedProduct.price)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-3 text-end">
                                    <button 
                                        className="btn btn-primary"
                                        onClick={() => handleGenerateLink(selectedProduct)}
                                        disabled={generating}
                                    >
                                        {generating ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                Đang tạo...
                                            </>
                                        ) : (
                                            'Tạo liên kết'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success/Error Messages */}
            {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                    {success}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setSuccess(null)}
                    ></button>
                </div>
            )}

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setError(null)}
                    ></button>
                </div>
            )}

            {/* Existing Links Section */}
            <div className="existing-links-section">
                <h4>Liên kết Affiliate của bạn</h4>
                
                {loading ? (
                    <div className="text-center py-4">
                        <div className="spinner-border" role="status">
                            <span className="sr-only">Đang tải liên kết...</span>
                        </div>
                    </div>
                ) : links.length > 0 ? (
                    <>
                        <div className="links-list">
                            {links.map((link) => (
                                <div key={link.id} className="link-card">
                                    <div className="row align-items-start">
                                        <div className="col-md-2">
                                            <img 
                                                src={link.product?.image || '/default-product.jpg'} 
                                                alt={link.product?.name || 'Sản phẩm'}
                                                className="img-fluid rounded"
                                            />
                                        </div>
                                        <div className="col-md-3">
                                            <h6 className="mb-1">{link.product?.name || 'Sản phẩm không xác định'}</h6>
                                            <small className="text-muted">
                                                Tạo: {new Date(link.createdAt).toLocaleDateString('vi-VN')}
                                            </small>
                                        </div>
                                        <div className="col-md-2">
                                            <div className="link-stats">
                                                <div className="stat-item">
                                                    <span className="stat-value">{link.clickCount || 0}</span>
                                                    <span className="stat-label">Lượt click</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-value">{link.conversions || 0}</span>
                                                    <span className="stat-label">Đơn hàng</span>
                                                </div>
                                                <div className="stat-item">
                                                    <span className="stat-value">
                                                        {CommonUtils.formatter.format(link.commission || 0)}
                                                    </span>
                                                    <span className="stat-label">Đã kiếm</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-5">
                                            <div className="link-actions">
                                                <div className="mb-2">
                                                    <label className="form-label small text-muted mb-1">Liên kết gốc:</label>
                                                    <div className="input-group">
                                                        <input 
                                                            type="text" 
                                                            className="form-control link-input" 
                                                            value={link.originalUrl}
                                                            readOnly
                                                        />
                                                        <button 
                                                            className="btn btn-outline-primary btn-sm"
                                                            onClick={() => handleCopyLink(link, 'original')}
                                                        >
                                                            {copiedLinkId === `${link.id}-original` ? (
                                                                <>
                                                                    <i className="fa fa-check"></i> Đã sao chép!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fa fa-copy"></i> Sao chép
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="mb-2">
                                                    <label className="form-label small text-muted mb-1">Liên kết rút gọn:</label>
                                                    <div className="input-group">
                                                        <input 
                                                            type="text" 
                                                            className="form-control link-input" 
                                                            value={link.shortUrl}
                                                            readOnly
                                                        />
                                                        <button 
                                                            className="btn btn-outline-success btn-sm"
                                                            onClick={() => handleCopyLink(link, 'short')}
                                                        >
                                                            {copiedLinkId === `${link.id}-short` ? (
                                                                <>
                                                                    <i className="fa fa-check"></i> Đã sao chép!
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <i className="fa fa-copy"></i> Sao chép
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {renderPagination()}
                    </>
                ) : (
                    <div className="no-links">
                        <div className="text-center py-5">
                            <i className="fa fa-link fa-3x text-muted mb-3"></i>
                            <h5>Chưa có liên kết Affiliate</h5>
                            <p className="text-muted">
                                Bắt đầu bằng cách chọn sản phẩm từ Danh mục sản phẩm để tạo liên kết affiliate đầu tiên.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkGenerator;
import React, { useState, useEffect } from 'react';
import { getProducts } from '../../../services/affiliateService';
import CommonUtils from '../../../utils/CommonUtils';
import './ProductCatalog.scss';

/**
 * Product Catalog Component
 * Displays products available for KOL promotion with filtering and search
 */
const ProductCatalog = ({ onProductSelect }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categories, setCategories] = useState([]);

    const ITEMS_PER_PAGE = 12;

    // Fetch products based on current filters
    const fetchProducts = async (page = 1, search = '', category = '') => {
        try {
            setLoading(true);
            const params = {
                page,
                limit: ITEMS_PER_PAGE,
                search: search.trim(),
                category
            };

            const response = await getProducts(params);

            if (response.errCode === 0) {
                setProducts(response.data.products || []);
                setTotalPages(Math.ceil((response.data.total || 0) / ITEMS_PER_PAGE));

                // Extract unique categories from products
                if (response.data.categories) {
                    setCategories(response.data.categories);
                }
            } else {
                setError(response.errMessage || 'Failed to fetch products');
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            setError('Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        fetchProducts();
    }, []);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchProducts(1, searchTerm, selectedCategory);
    };

    // Handle category filter
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setCurrentPage(1);
        fetchProducts(1, searchTerm, category);
    };

    // Handle pagination
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchProducts(page, searchTerm, selectedCategory);
    };

    // Handle product selection
    const handleProductClick = (product) => {
        if (onProductSelect) {
            onProductSelect(product);
        }
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
                        Previous
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
                        Next
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
        <div className="product-catalog">
            <div className="catalog-header">
                <h3>Product Catalog</h3>
                <p>Select products to create affiliate links and start earning commissions.</p>
            </div>

            {/* Search and Filter Section */}
            <div className="catalog-filters">
                <div className="row">
                    <div className="col-md-6">
                        <form onSubmit={handleSearch} className="search-form">
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search products..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <div className="input-group-append">
                                    <button className="btn btn-primary" type="submit">
                                        <i className="fa fa-search"></i>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="col-md-6">
                        <select
                            className="form-control category-filter"
                            value={selectedCategory}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="catalog-loading">
                    <div className="spinner-border" role="status">
                        <span className="sr-only">Loading products...</span>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            {!loading && !error && (
                <>
                    <div className="products-grid">
                        <div className="row">
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <div key={product.id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
                                        <div className="product-card">
                                            <div className="product-image" onClick={() => handleProductClick(product)} style={{ cursor: 'pointer' }}>
                                                <img
                                                    src={product.image || '/default-product.jpg'}
                                                    alt={product.name}
                                                    className="img-fluid"
                                                />
                                            </div>

                                            <div className="product-info">
                                                <h5 className="product-name">{product.name}</h5>
                                                <div className="product-price">
                                                    {product.discountPrice && product.discountPrice < product.price ? (
                                                        <>
                                                            <span className="current-price">
                                                                {CommonUtils.formatter.format(product.discountPrice)}
                                                            </span>
                                                            <span className="original-price">
                                                                {CommonUtils.formatter.format(product.price)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="current-price">
                                                            {CommonUtils.formatter.format(product.price)}
                                                        </span>
                                                    )}
                                                </div>
                                                {product.category && (
                                                    <div className="product-category">
                                                        <small className="text-muted">{product.category.name}</small>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12">
                                    <div className="no-products">
                                        <div className="text-center">
                                            <i className="fa fa-box-open fa-3x text-muted mb-3"></i>
                                            <h4>No Products Found</h4>
                                            <p className="text-muted">
                                                {searchTerm || selectedCategory
                                                    ? 'Try adjusting your search or filter criteria.'
                                                    : 'No products are currently available for promotion.'
                                                }
                                            </p>
                                            {(searchTerm || selectedCategory) && (
                                                <button
                                                    className="btn btn-outline-primary"
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setSelectedCategory('');
                                                        setCurrentPage(1);
                                                        fetchProducts(1, '', '');
                                                    }}
                                                >
                                                    Clear Filters
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination */}
                    {renderPagination()}
                </>
            )}
        </div>
    );
};

export default ProductCatalog;
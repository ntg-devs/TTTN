import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllKolApplications } from '../../../services/adminKolService';
import { toast } from 'react-toastify';
import moment from 'moment';
import './ManageKolApplications.scss';

const ManageKolApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        limit: 10
    });
    const [filters, setFilters] = useState({
        status: '',
        page: 1
    });

    // Fetch applications on component mount and when filters change
    useEffect(() => {
        fetchApplications();
    }, [filters]);

    // Function to fetch applications with current filters
    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await getAllKolApplications({
                status: filters.status,
                page: filters.page,
                limit: pagination.limit
            });

            if (response && response.errCode === 0) {
                setApplications(response.data.applications);
                setPagination({
                    currentPage: response.data.pagination.currentPage,
                    totalPages: response.data.pagination.totalPages,
                    limit: response.data.pagination.limit
                });
            } else {
                toast.error('Failed to fetch KOL applications');
            }
        } catch (error) {
            console.error('Error fetching KOL applications:', error);
            toast.error('Error fetching KOL applications');
        } finally {
            setLoading(false);
        }
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
            page: 1 // Reset to first page when filter changes
        });
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        
        setFilters({
            ...filters,
            page: newPage
        });
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'badge bg-warning text-dark';
            case 'approved':
                return 'badge bg-success';
            case 'rejected':
                return 'badge bg-danger';
            default:
                return 'badge bg-secondary';
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return moment(dateString).format('DD/MM/YYYY HH:mm');
    };

    // Render pagination
    const renderPagination = () => {
        const { currentPage, totalPages } = pagination;
        
        if (totalPages <= 1) return null;
        
        return (
            <nav aria-label="Page navigation">
                <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>
                    </li>
                    
                    {/* First page */}
                    {currentPage > 2 && (
                        <li className="page-item">
                            <button 
                                className="page-link" 
                                onClick={() => handlePageChange(1)}
                            >
                                1
                            </button>
                        </li>
                    )}
                    
                    {/* Ellipsis */}
                    {currentPage > 3 && (
                        <li className="page-item disabled">
                            <span className="page-link">...</span>
                        </li>
                    )}
                    
                    {/* Previous page */}
                    {currentPage > 1 && (
                        <li className="page-item">
                            <button 
                                className="page-link" 
                                onClick={() => handlePageChange(currentPage - 1)}
                            >
                                {currentPage - 1}
                            </button>
                        </li>
                    )}
                    
                    {/* Current page */}
                    <li className="page-item active">
                        <span className="page-link">{currentPage}</span>
                    </li>
                    
                    {/* Next page */}
                    {currentPage < totalPages && (
                        <li className="page-item">
                            <button 
                                className="page-link" 
                                onClick={() => handlePageChange(currentPage + 1)}
                            >
                                {currentPage + 1}
                            </button>
                        </li>
                    )}
                    
                    {/* Ellipsis */}
                    {currentPage < totalPages - 2 && (
                        <li className="page-item disabled">
                            <span className="page-link">...</span>
                        </li>
                    )}
                    
                    {/* Last page */}
                    {currentPage < totalPages - 1 && (
                        <li className="page-item">
                            <button 
                                className="page-link" 
                                onClick={() => handlePageChange(totalPages)}
                            >
                                {totalPages}
                            </button>
                        </li>
                    )}
                    
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                            className="page-link" 
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };

    return (
        <div className="container-fluid px-4">
            <h1 className="mt-4">KOL Applications</h1>
            <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item">
                    <Link to="/admin">Dashboard</Link>
                </li>
                <li className="breadcrumb-item active">KOL Applications</li>
            </ol>
            
            {/* Filters */}
            <div className="card mb-4">
                <div className="card-header">
                    <i className="fas fa-filter me-1"></i>
                    Filters
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4">
                            <div className="form-group">
                                <label htmlFor="statusFilter">Status</label>
                                <select 
                                    className="form-select" 
                                    id="statusFilter"
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="form-group mt-4">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => fetchApplications()}
                                >
                                    Apply Filters
                                </button>
                                <button 
                                    className="btn btn-secondary ms-2"
                                    onClick={() => {
                                        setFilters({
                                            status: '',
                                            page: 1
                                        });
                                    }}
                                >
                                    Reset
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Applications Table */}
            <div className="card mb-4">
                <div className="card-header">
                    <i className="fas fa-table me-1"></i>
                    KOL Applications
                </div>
                <div className="card-body">
                    {loading ? (
                        <div className="text-center">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="alert alert-info">
                            No applications found.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Application Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map((app) => (
                                        <tr key={app.id}>
                                            <td>{app.id}</td>
                                            <td>
                                                {app.user ? (
                                                    <div className="d-flex align-items-center">
                                                        {app.user.image && (
                                                            <img 
                                                                src={app.user.image} 
                                                                alt={`${app.user.firstName} ${app.user.lastName}`}
                                                                className="user-avatar me-2"
                                                            />
                                                        )}
                                                        <span>{app.user.firstName} {app.user.lastName}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Unknown User</span>
                                                )}
                                            </td>
                                            <td>{app.user ? app.user.email : 'N/A'}</td>
                                            <td>
                                                <span className={getStatusBadgeClass(app.status)}>
                                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                                </span>
                                            </td>
                                            <td>{formatDate(app.createdAt)}</td>
                                            <td>
                                                <Link 
                                                    to={`/admin/kol/applications/${app.id}`}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    <i className="fas fa-eye me-1"></i> View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    
                    {/* Pagination */}
                    {renderPagination()}
                </div>
            </div>
        </div>
    );
};

export default ManageKolApplications;
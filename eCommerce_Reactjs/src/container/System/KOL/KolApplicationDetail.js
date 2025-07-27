import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getKolApplicationDetails, approveKolApplication, rejectKolApplication } from '../../../services/adminKolService';
import { toast } from 'react-toastify';
import moment from 'moment';
import './KolApplicationDetail.scss';

const KolApplicationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const [approvalReason, setApprovalReason] = useState('');
    const [totalFollowers, setTotalFollowers] = useState('');
    const [displayTotalFollowers, setDisplayTotalFollowers] = useState('');

    // Fetch application details on component mount
    useEffect(() => {
        fetchApplicationDetails();
    }, [id]);

    // Function to fetch application details
    const fetchApplicationDetails = async () => {
        try {
            setLoading(true);
            const response = await getKolApplicationDetails(id);

            if (response && response.errCode === 0) {
                setApplication(response.data.application);
                setUser(response.data.user);
            } else {
                toast.error('Failed to fetch application details');
            }
        } catch (error) {
            console.error('Error fetching application details:', error);
            toast.error('Error fetching application details');
        } finally {
            setLoading(false);
        }
    };

    // Handle approve application
    const handleApprove = async () => {
        if (!approvalReason.trim()) {
            toast.error('Please provide a reason for approval');
            return;
        }

        if (!totalFollowers || isNaN(totalFollowers) || parseInt(totalFollowers) <= 0) {
            toast.error('Please enter a valid total followers count');
            return;
        }

        try {
            setProcessing(true);
            const response = await approveKolApplication(id, { 
                reason: approvalReason, 
                total_followers: parseInt(totalFollowers) 
            });

            if (response && response.errCode === 0) {
                toast.success('Application approved successfully');
                setShowApproveModal(false);
                setApprovalReason('');
                setTotalFollowers('');
                setDisplayTotalFollowers('');
                fetchApplicationDetails(); // Refresh data
            } else {
                toast.error(response.errMessage || 'Failed to approve application');
            }
        } catch (error) {
            console.error('Error approving application:', error);
            toast.error('Error approving application');
        } finally {
            setProcessing(false);
        }
    };

    // Handle reject application
    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            setProcessing(true);
            const response = await rejectKolApplication(id, { reason: rejectionReason });

            if (response && response.errCode === 0) {
                toast.success('Application rejected successfully');
                setShowRejectModal(false);
                fetchApplicationDetails(); // Refresh data
            } else {
                toast.error(response.errMessage || 'Failed to reject application');
            }
        } catch (error) {
            console.error('Error rejecting application:', error);
            toast.error('Error rejecting application');
        } finally {
            setProcessing(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        return dateString ? moment(dateString).format('DD/MM/YYYY HH:mm') : 'N/A';
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

    // Render social media links
    const renderSocialMediaLinks = (links) => {
        if (!links) return <p>No social media links provided</p>;

        // Parse JSON string if needed
        let parsedLinks;
        try {
            parsedLinks = typeof links === 'string' ? JSON.parse(links) : links;
        } catch (error) {
            console.error('Error parsing social media links:', error);
            return <p>Error parsing social media links</p>;
        }

        if (!parsedLinks || Object.keys(parsedLinks).length === 0) {
            return <p>No social media links provided</p>;
        }

        return (
            <ul className="list-group">
                {parsedLinks.facebook && (
                    <li className="list-group-item">
                        <i className="fab fa-facebook text-primary me-2"></i>
                        <a href={parsedLinks.facebook} target="_blank" rel="noopener noreferrer">
                            {parsedLinks.facebook}
                        </a>
                    </li>
                )}
                {parsedLinks.instagram && (
                    <li className="list-group-item">
                        <i className="fab fa-instagram text-danger me-2"></i>
                        <a href={parsedLinks.instagram} target="_blank" rel="noopener noreferrer">
                            {parsedLinks.instagram}
                        </a>
                    </li>
                )}
                {parsedLinks.tiktok && (
                    <li className="list-group-item">
                        <i className="fab fa-tiktok text-dark me-2"></i>
                        <a href={parsedLinks.tiktok} target="_blank" rel="noopener noreferrer">
                            {parsedLinks.tiktok}
                        </a>
                    </li>
                )}
                {parsedLinks.youtube && (
                    <li className="list-group-item">
                        <i className="fab fa-youtube text-danger me-2"></i>
                        <a href={parsedLinks.youtube} target="_blank" rel="noopener noreferrer">
                            {parsedLinks.youtube}
                        </a>
                    </li>
                )}
                {parsedLinks.twitter && (
                    <li className="list-group-item">
                        <i className="fab fa-twitter text-info me-2"></i>
                        <a href={parsedLinks.twitter} target="_blank" rel="noopener noreferrer">
                            {parsedLinks.twitter}
                        </a>
                    </li>
                )}
                {parsedLinks.other && (
                    <li className="list-group-item">
                        <i className="fas fa-link text-secondary me-2"></i>
                        <a href={parsedLinks.other} target="_blank" rel="noopener noreferrer">
                            {parsedLinks.other}
                        </a>
                    </li>
                )}
            </ul>
        );
    };

    // Render identification document
    const renderIdentificationDocument = (document) => {
        if (!document) return <p>No identification document provided</p>;

        // Parse JSON string if needed
        let parsedDocument;
        try {
            parsedDocument = typeof document === 'string' ? JSON.parse(document) : document;
        } catch (error) {
            console.error('Error parsing identification document:', error);
            return <p>Error parsing identification document</p>;
        }

        if (!parsedDocument) return <p>No identification document provided</p>;

        const documentTypeLabels = {
            'nationalId': 'Chứng Minh Nhân Dân',
            'passport': 'Hộ Chiếu',
            'driverLicense': 'Giấy Phép Lái Xe'
        };

        return (
            <div className="card">
                <div className="card-body">
                    <h6 className="card-subtitle mb-2 text-muted">Document Details</h6>
                    <p><strong>Type:</strong> {documentTypeLabels[parsedDocument.documentType] || parsedDocument.documentType}</p>
                    <p><strong>Number:</strong> {parsedDocument.documentNumber}</p>
                    
                    {parsedDocument.documentImage && (
                        <div className="mt-3">
                            <h6>Document Image</h6>
                            <div className="document-image-container">
                                <img 
                                    src={parsedDocument.documentImage} 
                                    alt="Identification Document" 
                                    className="img-fluid document-image"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render approve modal
    const renderApproveModal = () => {
        return (
            <div className={`modal fade ${showApproveModal ? 'show' : ''}`} style={{ display: showApproveModal ? 'block' : 'none' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Approve KOL Application</h5>
                            <button type="button" className="btn-close" onClick={() => {
                                setShowApproveModal(false);
                                setApprovalReason('');
                                setTotalFollowers('');
                                setDisplayTotalFollowers('');
                            }} disabled={processing}></button>
                        </div>
                        <div className="modal-body">
                            <p>Please provide the following information to approve this KOL application:</p>
                            
                            <div className="form-group mb-3">
                                <label htmlFor="approvalReason" className="form-label">Approval Reason *</label>
                                <textarea 
                                    id="approvalReason"
                                    className="form-control" 
                                    rows="3" 
                                    value={approvalReason}
                                    onChange={(e) => setApprovalReason(e.target.value)}
                                    placeholder="Enter approval reason..."
                                    disabled={processing}
                                    required
                                ></textarea>
                            </div>

                            <div className="form-group mb-3">
                                <label htmlFor="totalFollowers" className="form-label">Total Followers *</label>
                                <input 
                                    type="text" 
                                    id="totalFollowers"
                                    className="form-control" 
                                    value={displayTotalFollowers}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/,/g, '');
                                        if (value === '' || /^\d+$/.test(value)) {
                                            setDisplayTotalFollowers(value.replace(/\B(?=(\d{3})+(?!\d))/g, ','));
                                            setTotalFollowers(value);
                                        }
                                    }}
                                    placeholder="Enter total followers count (e.g., 1,000,000)"
                                    disabled={processing}
                                    required
                                />
                                <div className="form-text">Enter the total number of followers across all social media platforms</div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => {
                                setShowApproveModal(false);
                                setApprovalReason('');
                                setTotalFollowers('');
                                setDisplayTotalFollowers('');
                            }} disabled={processing}>Cancel</button>
                            <button type="button" className="btn btn-success" onClick={handleApprove} disabled={processing}>
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Processing...
                                    </>
                                ) : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render reject modal
    const renderRejectModal = () => {
        return (
            <div className={`modal fade ${showRejectModal ? 'show' : ''}`} style={{ display: showRejectModal ? 'block' : 'none' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Reject KOL Application</h5>
                            <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)} disabled={processing}></button>
                        </div>
                        <div className="modal-body">
                            <p>Please provide a reason for rejecting this application:</p>
                            <div className="form-group">
                                <textarea 
                                    className="form-control" 
                                    rows="4" 
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter rejection reason..."
                                    disabled={processing}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={processing}>Cancel</button>
                            <button type="button" className="btn btn-danger" onClick={handleReject} disabled={processing}>
                                {processing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Processing...
                                    </>
                                ) : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Render modal backdrop
    const renderModalBackdrop = () => {
        if (showApproveModal || showRejectModal) {
            return <div className="modal-backdrop fade show"></div>;
        }
        return null;
    };

    return (
        <div className="container-fluid px-4">
            <h1 className="mt-4">KOL Application Details</h1>
            <ol className="breadcrumb mb-4">
                <li className="breadcrumb-item">
                    <Link to="/admin">Dashboard</Link>
                </li>
                <li className="breadcrumb-item">
                    <Link to="/admin/kol/applications">KOL Applications</Link>
                </li>
                <li className="breadcrumb-item active">Application Details</li>
            </ol>
            
            {loading ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : !application ? (
                <div className="alert alert-danger">
                    Application not found or you don't have permission to view it.
                </div>
            ) : (
                <>
                    {/* Action Buttons */}
                    <div className="mb-4">
                        <Link to="/admin/kol/applications" className="btn btn-secondary me-2">
                            <i className="fas fa-arrow-left me-1"></i> Back to List
                        </Link>
                        
                        {application.status === 'pending' && (
                            <>
                                <button 
                                    className="btn btn-success me-2" 
                                    onClick={() => setShowApproveModal(true)}
                                >
                                    <i className="fas fa-check me-1"></i> Approve
                                </button>
                                <button 
                                    className="btn btn-danger" 
                                    onClick={() => setShowRejectModal(true)}
                                >
                                    <i className="fas fa-times me-1"></i> Reject
                                </button>
                            </>
                        )}
                    </div>
                    
                    {/* Application Status */}
                    <div className="card mb-4">
                        <div className="card-header">
                            <i className="fas fa-info-circle me-1"></i>
                            Application Status
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <p><strong>Status:</strong> <span className={getStatusBadgeClass(application.status)}>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span></p>
                                    <p><strong>Application Date:</strong> {formatDate(application.createdAt)}</p>
                                    {application.reviewDate && (
                                        <p><strong>Review Date:</strong> {formatDate(application.reviewDate)}</p>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    {application.status === 'rejected' && application.reason && (
                                        <div className="alert alert-danger">
                                            <strong>Rejection Reason:</strong> {application.reason}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* User Information */}
                    {user && (
                        <div className="card mb-4">
                            <div className="card-header">
                                <i className="fas fa-user me-1"></i>
                                User Information
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-2">
                                        {user.image ? (
                                            <img 
                                                src={user.image} 
                                                alt={`${user.firstName} ${user.lastName}`}
                                                className="img-fluid rounded user-profile-image"
                                            />
                                        ) : (
                                            <div className="user-profile-placeholder">
                                                <i className="fas fa-user fa-5x"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-md-10">
                                        <h4>{user.firstName} {user.lastName}</h4>
                                        <p><strong>Email:</strong> {user.email}</p>
                                        <p><strong>Phone:</strong> {user.phoneNumber || 'N/A'}</p>
                                        <p><strong>KOL Status:</strong> {user.kolStatus || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Application Details */}
                    <div className="row">
                        {/* Social Media Links */}
                        <div className="col-md-6">
                            <div className="card mb-4">
                                <div className="card-header">
                                    <i className="fas fa-share-alt me-1"></i>
                                    Social Media Links
                                </div>
                                <div className="card-body">
                                    {renderSocialMediaLinks(application.socialMediaLinks)}
                                </div>
                            </div>
                        </div>
                        
                        {/* Identification Document */}
                        <div className="col-md-6">
                            <div className="card mb-4">
                                <div className="card-header">
                                    <i className="fas fa-id-card me-1"></i>
                                    Identification Document
                                </div>
                                <div className="card-body">
                                    {renderIdentificationDocument(application.identificationDocument)}
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
            
            {/* Modals */}
            {renderApproveModal()}
            {renderRejectModal()}
            {renderModalBackdrop()}
        </div>
    );
};

export default KolApplicationDetail;
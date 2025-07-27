import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getKolStatus } from '../../../services/kolService';
import './KolApplicationStatus.scss';

/**
 * KOL Application Status Component
 * Shows the current status of a user's KOL application
 * 
 * Requirements:
 * 1.4 - Display application status on user profile
 */
const KolApplicationStatus = () => {
    const { userId } = useParams();
    
    // Application status state
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Fetch application status on component mount
    useEffect(() => {
        const fetchApplicationStatus = async () => {
            try {
                setIsLoading(true);
                const response = await getKolStatus();
                
                if (response && response.data) {
                    setApplicationStatus(response.data);
                } else {
                    setError('Failed to retrieve application status');
                }
            } catch (error) {
                console.error('Error fetching KOL application status:', error);
                setError('An error occurred while retrieving your application status');
                toast.error('Failed to load application status');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchApplicationStatus();
    }, [userId]);
    
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    // Render loading state
    if (isLoading) {
        return (
            <div className="kol-status-container">
                <div className="kol-status-header">
                    <h2>KOL Application Status</h2>
                </div>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }
    
    // Render error state
    if (error || !applicationStatus) {
        return (
            <div className="kol-status-container">
                <div className="kol-status-header">
                    <h2>KOL Application Status</h2>
                </div>
                <div className="status-error">
                    <p>{error || 'No application found'}</p>
                    <Link to="/user/kol/register" className="btn-apply">
                        Apply to become a KOL
                    </Link>
                </div>
            </div>
        );
    }
    
    // If user hasn't applied yet
    if (!applicationStatus.hasApplied) {
        return (
            <div className="kol-status-container">
                <div className="kol-status-header">
                    <h2>KOL Application Status</h2>
                </div>
                <div className="no-application">
                    <p>You haven't applied to become a KOL yet.</p>
                    <Link to="/user/kol/register" className="btn-apply">
                        Apply Now
                    </Link>
                </div>
            </div>
        );
    }
    
    return (
        <div className="kol-status-container">
            <div className="kol-status-header">
                <h2>KOL Application Status</h2>
            </div>
            
            <div className={`status-card status-${applicationStatus.status}`}>
                <div className="status-icon">
                    {applicationStatus.status === 'pending' && <i className="fas fa-clock"></i>}
                    {applicationStatus.status === 'approved' && <i className="fas fa-check-circle"></i>}
                    {applicationStatus.status === 'rejected' && <i className="fas fa-times-circle"></i>}
                </div>
                
                <div className="status-details">
                    <h3 className="status-title">
                        {applicationStatus.status === 'pending' && 'Application Under Review'}
                        {applicationStatus.status === 'approved' && 'Application Approved'}
                        {applicationStatus.status === 'rejected' && 'Application Rejected'}
                    </h3>
                    
                    <div className="status-info">
                        <p className="status-message">
                            {applicationStatus.status === 'pending' && 
                                'Your application is currently being reviewed by our team. We will notify you once a decision has been made.'}
                            {applicationStatus.status === 'approved' && 
                                'Congratulations! Your application has been approved. You can now start promoting products and earning commissions.'}
                            {applicationStatus.status === 'rejected' && 
                                'Unfortunately, your application has been rejected. You may submit a new application with updated information.'}
                        </p>
                        
                        {applicationStatus.status === 'rejected' && applicationStatus.reason && (
                            <div className="rejection-reason">
                                <h4>Reason for Rejection:</h4>
                                <p>{applicationStatus.reason}</p>
                            </div>
                        )}
                        
                        <div className="status-dates">
                            <p><strong>Application Date:</strong> {formatDate(applicationStatus.applicationDate)}</p>
                            {applicationStatus.reviewDate && (
                                <p><strong>Review Date:</strong> {formatDate(applicationStatus.reviewDate)}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Action buttons based on status */}
            <div className="status-actions">
                {applicationStatus.status === 'pending' && (
                    <p className="status-note">
                        Please be patient while we review your application. This process typically takes 1-3 business days.
                    </p>
                )}
                
                {applicationStatus.status === 'approved' && (
                    <Link to="/user/kol/dashboard" className="btn-dashboard">
                        Go to KOL Dashboard
                    </Link>
                )}
                
                {applicationStatus.status === 'rejected' && (
                    <Link to="/user/kol/register" className="btn-reapply">
                        Submit New Application
                    </Link>
                )}
            </div>
            
            {/* Display social media links provided in application */}
            {applicationStatus.socialMediaLinks && (
                <div className="application-details">
                    <h3>Social Media Links Provided</h3>
                    <ul className="social-media-list">
                        {applicationStatus.socialMediaLinks.facebook && (
                            <li>
                                <strong>Facebook:</strong> {applicationStatus.socialMediaLinks.facebook}
                            </li>
                        )}
                        {applicationStatus.socialMediaLinks.instagram && (
                            <li>
                                <strong>Instagram:</strong> {applicationStatus.socialMediaLinks.instagram}
                            </li>
                        )}
                        {applicationStatus.socialMediaLinks.tiktok && (
                            <li>
                                <strong>TikTok:</strong> {applicationStatus.socialMediaLinks.tiktok}
                            </li>
                        )}
                        {applicationStatus.socialMediaLinks.youtube && (
                            <li>
                                <strong>YouTube:</strong> {applicationStatus.socialMediaLinks.youtube}
                            </li>
                        )}
                        {applicationStatus.socialMediaLinks.twitter && (
                            <li>
                                <strong>Twitter:</strong> {applicationStatus.socialMediaLinks.twitter}
                            </li>
                        )}
                        {applicationStatus.socialMediaLinks.other && (
                            <li>
                                <strong>Other:</strong> {applicationStatus.socialMediaLinks.other}
                            </li>
                        )}
                    </ul>
                </div>
            )}
            
            {/* Help section */}
            <div className="help-section">
                <h3>Need Help?</h3>
                <p>If you have any questions about your application or the KOL program, please contact our support team.</p>
                <Link to="/contact" className="btn-contact">
                    Contact Support
                </Link>
            </div>
        </div>
    );
};

export default KolApplicationStatus;
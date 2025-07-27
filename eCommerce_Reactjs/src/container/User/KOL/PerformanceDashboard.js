import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../../../services/affiliateService';
import CommonUtils from '../../../utils/CommonUtils';
import useRealtimeStats from '../../../hooks/useRealtimeStats';
import './PerformanceDashboard.scss';

/**
 * Performance Dashboard Component
 * Displays KOL performance metrics with visualizations and filtering
 */
const PerformanceDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('30'); // Default to last 30 days
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [customDateRange, setCustomDateRange] = useState(false);

    // Get user info for real-time stats
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const kolId = userInfo.id;
    const token = localStorage.getItem('token');

    // Real-time stats hook
    const {
        stats: realtimeStats,
        isConnected: isRealtimeConnected,
        isConnecting: isRealtimeConnecting,
        error: realtimeError,
        lastUpdate,
        connect: connectRealtime,
        disconnect: disconnectRealtime,
        refreshStats
    } = useRealtimeStats({
        kolId,
        token,
        autoConnect: true
    });

    // Calculate date range based on selection
    const getDateRange = (days) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - parseInt(days));
        
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        };
    };

    // Fetch dashboard data
    const fetchDashboardData = async (params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const response = await getDashboardData(params);
            
            if (response.errCode === 0) {
                setDashboardData(response.data);
            } else {
                setError(response.errMessage || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Initial load
    useEffect(() => {
        const { startDate: start, endDate: end } = getDateRange(dateRange);
        fetchDashboardData({ startDate: start, endDate: end });
    }, []);

    // Handle date range change
    const handleDateRangeChange = (range) => {
        setDateRange(range);
        setCustomDateRange(false);
        
        if (range !== 'custom') {
            const { startDate: start, endDate: end } = getDateRange(range);
            fetchDashboardData({ startDate: start, endDate: end });
        }
    };

    // Handle custom date range
    const handleCustomDateRange = () => {
        if (startDate && endDate) {
            setCustomDateRange(true);
            setDateRange('custom');
            fetchDashboardData({ startDate, endDate });
        }
    };

    // Calculate conversion rate
    const getConversionRate = (clicks, conversions) => {
        if (!clicks || clicks === 0) return 0;
        return ((conversions / clicks) * 100).toFixed(2);
    };

    // Get performance trend indicator
    const getTrendIndicator = (current, previous) => {
        if (!previous || previous === 0) return { trend: 'neutral', percentage: 0 };
        
        const change = ((current - previous) / previous) * 100;
        return {
            trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
            percentage: Math.abs(change).toFixed(1)
        };
    };

    if (loading) {
        return (
            <div className="performance-dashboard">
                <div className="dashboard-loading">
                    <div className="spinner-border" role="status">
                        <span className="sr-only">Loading dashboard...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="performance-dashboard">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    const data = dashboardData || {};
    const summary = data.overview || {}; // API returns 'overview' not 'summary'
    const topLinks = data.topPerformingLinks || []; // API returns 'topPerformingLinks' not 'topLinks'
    const recentActivity = data.recentActivity || [];

    return (
        <div className="performance-dashboard">
            <div className="dashboard-header">
                <h3>Performance Dashboard</h3>
                <p>Track your affiliate marketing performance and optimize your strategy.</p>
                
                {/* Real-time Stats Status */}
                <div className="realtime-status">
                    <div className={`status-indicator ${isRealtimeConnected ? 'connected' : 'disconnected'}`}>
                        <i className={`fa ${isRealtimeConnected ? 'fa-circle' : 'fa-circle-o'}`}></i>
                        <span>
                            {isRealtimeConnecting ? 'Connecting...' : 
                             isRealtimeConnected ? 'Live Updates Active' : 'Live Updates Offline'}
                        </span>
                        {lastUpdate && (
                            <small className="last-update">
                                Last updated: {lastUpdate.toLocaleTimeString()}
                            </small>
                        )}
                    </div>
                    {!isRealtimeConnected && !isRealtimeConnecting && (
                        <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={connectRealtime}
                        >
                            <i className="fa fa-refresh"></i> Reconnect
                        </button>
                    )}
                    {realtimeError && (
                        <div className="alert alert-warning alert-sm">
                            <i className="fa fa-exclamation-triangle"></i>
                            Real-time updates unavailable. Using polling fallback.
                        </div>
                    )}
                </div>
            </div>

            {/* Real-time Stats Section */}
            {realtimeStats && (
                <div className="realtime-stats-section">
                    <h4>
                        <i className="fa fa-bolt text-warning"></i>
                        Live Statistics
                    </h4>
                    <div className="row">
                        <div className="col-lg-6 mb-3">
                            <div className="realtime-card">
                                <h5>Last Hour</h5>
                                <div className="realtime-metrics">
                                    <div className="metric">
                                        <span className="metric-value">{realtimeStats.realtime?.clicks || 0}</span>
                                        <span className="metric-label">Clicks</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">{realtimeStats.realtime?.conversions || 0}</span>
                                        <span className="metric-label">Conversions</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">{realtimeStats.realtime?.conversionRate || 0}%</span>
                                        <span className="metric-label">Conv. Rate</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">
                                            {CommonUtils.formatter.format(realtimeStats.realtime?.commissionAmount || 0)}
                                        </span>
                                        <span className="metric-label">Commission</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 mb-3">
                            <div className="realtime-card">
                                <h5>Today</h5>
                                <div className="realtime-metrics">
                                    <div className="metric">
                                        <span className="metric-value">{realtimeStats.today?.clicks || 0}</span>
                                        <span className="metric-label">Clicks</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">{realtimeStats.today?.conversions || 0}</span>
                                        <span className="metric-label">Conversions</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">{realtimeStats.today?.conversionRate || 0}%</span>
                                        <span className="metric-label">Conv. Rate</span>
                                    </div>
                                    <div className="metric">
                                        <span className="metric-value">
                                            {CommonUtils.formatter.format(realtimeStats.today?.commissionAmount || 0)}
                                        </span>
                                        <span className="metric-label">Commission</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {realtimeStats.pending && (
                        <div className="pending-stats">
                            <div className="alert alert-info">
                                <i className="fa fa-clock-o"></i>
                                <strong>Pending Commissions:</strong> {realtimeStats.pending.commissionCount || 0} transactions 
                                ({CommonUtils.formatter.format(realtimeStats.pending.commissionAmount || 0)})
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Date Range Filter */}
            <div className="date-filter-section">
                <div className="row align-items-end">
                    <div className="col-md-6">
                        <label className="form-label">Date Range</label>
                        <select 
                            className="form-select"
                            value={dateRange}
                            onChange={(e) => handleDateRangeChange(e.target.value)}
                        >
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                            <option value="90">Last 90 days</option>
                            <option value="365">Last year</option>
                            <option value="custom">Custom range</option>
                        </select>
                    </div>
                    {dateRange === 'custom' && (
                        <>
                            <div className="col-md-2">
                                <label className="form-label">Start Date</label>
                                <input 
                                    type="date" 
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">End Date</label>
                                <input 
                                    type="date" 
                                    className="form-control"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="col-md-2">
                                <button 
                                    className="btn btn-primary w-100"
                                    onClick={handleCustomDateRange}
                                    disabled={!startDate || !endDate}
                                >
                                    Apply
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="row">
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="summary-card">
                            <div className="card-icon">
                                <i className="fa fa-mouse-pointer"></i>
                            </div>
                            <div className="card-content">
                                <h3>{summary.totalClicks || 0}</h3>
                                <p>Total Clicks</p>
                                {summary.previousClicks !== undefined && (
                                    <div className={`trend ${getTrendIndicator(summary.totalClicks, summary.previousClicks).trend}`}>
                                        <i className={`fa fa-arrow-${getTrendIndicator(summary.totalClicks, summary.previousClicks).trend === 'up' ? 'up' : 'down'}`}></i>
                                        {getTrendIndicator(summary.totalClicks, summary.previousClicks).percentage}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="summary-card">
                            <div className="card-icon">
                                <i className="fa fa-shopping-cart"></i>
                            </div>
                            <div className="card-content">
                                <h3>{summary.totalConversions || 0}</h3>
                                <p>Conversions</p>
                                {summary.previousConversions !== undefined && (
                                    <div className={`trend ${getTrendIndicator(summary.totalConversions, summary.previousConversions).trend}`}>
                                        <i className={`fa fa-arrow-${getTrendIndicator(summary.totalConversions, summary.previousConversions).trend === 'up' ? 'up' : 'down'}`}></i>
                                        {getTrendIndicator(summary.totalConversions, summary.previousConversions).percentage}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="summary-card">
                            <div className="card-icon">
                                <i className="fa fa-percentage"></i>
                            </div>
                            <div className="card-content">
                                <h3>{getConversionRate(summary.totalClicks, summary.totalConversions)}%</h3>
                                <p>Conversion Rate</p>
                                <div className="trend neutral">
                                    <i className="fa fa-info-circle"></i>
                                    Avg: {summary.averageConversionRate || '0.00'}%
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="summary-card">
                            <div className="card-icon">
                                <i className="fa fa-dollar-sign"></i>
                            </div>
                            <div className="card-content">
                                <h3>{CommonUtils.formatter.format(summary.totalCommission || 0)}</h3>
                                <p>Total Commission</p>
                                {summary.previousCommission !== undefined && (
                                    <div className={`trend ${getTrendIndicator(summary.totalCommission, summary.previousCommission).trend}`}>
                                        <i className={`fa fa-arrow-${getTrendIndicator(summary.totalCommission, summary.previousCommission).trend === 'up' ? 'up' : 'down'}`}></i>
                                        {getTrendIndicator(summary.totalCommission, summary.previousCommission).percentage}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tier Information */}
            {data.tierInfo && (
                <div className="tier-info-section mb-4">
                    <div className="row">
                        <div className="col-lg-6">
                            <div className="tier-card">
                                <div className="tier-header">
                                    <h5>
                                        <i className="fa fa-star text-warning"></i>
                                        Current Tier: {data.tierInfo.currentTier === 'high' ? 'High Performance' : 'Standard'}
                                    </h5>
                                </div>
                                <div className="tier-details">
                                    <div className="tier-metric">
                                        <span className="metric-label">Commission Rate:</span>
                                        <span className="metric-value">{data.tierInfo.currentRate}%</span>
                                    </div>
                                    <div className="tier-metric">
                                        <span className="metric-label">Total Sales:</span>
                                        <span className="metric-value">{CommonUtils.formatter.format(data.tierInfo.totalSales)}</span>
                                    </div>
                                    {data.tierInfo.nextTierThreshold && (
                                        <div className="tier-metric">
                                            <span className="metric-label">Sales to Next Tier:</span>
                                            <span className="metric-value">{CommonUtils.formatter.format(data.tierInfo.salesUntilNextTier)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="commission-breakdown-card">
                                <h5>
                                    <i className="fa fa-chart-pie text-info"></i>
                                    Commission Breakdown
                                </h5>
                                <div className="commission-stats">
                                    <div className="commission-stat">
                                        <span className="stat-label">Pending</span>
                                        <span className="stat-value">{data.commissions?.pending?.count || 0}</span>
                                        <span className="stat-amount">{CommonUtils.formatter.format(data.commissions?.pending?.amount || 0)}</span>
                                    </div>
                                    <div className="commission-stat">
                                        <span className="stat-label">Completed</span>
                                        <span className="stat-value">{data.commissions?.completed?.count || 0}</span>
                                        <span className="stat-amount">{CommonUtils.formatter.format(data.commissions?.completed?.amount || 0)}</span>
                                    </div>
                                    <div className="commission-stat">
                                        <span className="stat-label">Cancelled</span>
                                        <span className="stat-value">{data.commissions?.cancelled?.count || 0}</span>
                                        <span className="stat-amount">{CommonUtils.formatter.format(data.commissions?.cancelled?.amount || 0)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Performing Links */}
            <div className="top-links-section">
                <h4>Top Performing Links</h4>
                {topLinks.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Clicks</th>
                                    <th>Conversions</th>
                                    <th>Conversion Rate</th>
                                    <th>Earnings</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topLinks.map((link, index) => (
                                    <tr key={link.id || index}>
                                        <td>
                                            <div className="product-info">
                                                <img 
                                                    src={link.product?.image || '/default-product.jpg'} 
                                                    alt={link.product?.name || 'Product'}
                                                    className="product-thumb"
                                                />
                                                <span>{link.product?.name || 'Unknown Product'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="metric-value">{link.clicks || 0}</span>
                                        </td>
                                        <td>
                                            <span className="metric-value">{link.conversions || 0}</span>
                                        </td>
                                        <td>
                                            <span className="conversion-rate">
                                                {getConversionRate(link.clicks, link.conversions)}%
                                            </span>
                                        </td>
                                        <td>
                                            <span className="earnings">
                                                {CommonUtils.formatter.format(link.commission || 0)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="no-data">
                        <i className="fa fa-chart-line fa-2x text-muted mb-3"></i>
                        <p>No performance data available for the selected period.</p>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="recent-activity-section">
                <h4>Recent Activity</h4>
                {recentActivity.length > 0 ? (
                    <div className="activity-list">
                        {recentActivity.map((activity, index) => {
                            const activityType = activity.converted ? 'conversion' : 'click';
                            return (
                                <div key={activity.id || index} className="activity-item">
                                    <div className="activity-icon">
                                        <i className={`fa ${activityType === 'click' ? 'fa-mouse-pointer' : 'fa-shopping-cart'}`}></i>
                                    </div>
                                    <div className="activity-content">
                                        <div className="activity-title">
                                            {activityType === 'click' ? 'Link Clicked' : 'Sale Converted'}
                                        </div>
                                        <div className="activity-description">
                                            {activity.product?.name || 'Unknown Product'}
                                            {activityType === 'conversion' && activity.commission && (
                                                <span className="activity-amount">
                                                    - {CommonUtils.formatter.format(activity.commission)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="activity-time">
                                            {new Date(activity.clickedAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="no-data">
                        <i className="fa fa-clock fa-2x text-muted mb-3"></i>
                        <p>No recent activity to display.</p>
                    </div>
                )}
            </div>

            {/* Daily Performance Chart */}
            {data.dailyStats && data.dailyStats.length > 0 && (
                <div className="daily-stats-section">
                    <h4>Daily Performance</h4>
                    <div className="table-responsive">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Clicks</th>
                                    <th>Conversions</th>
                                    <th>Conversion Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.dailyStats.map((day, index) => (
                                    <tr key={index}>
                                        <td>{new Date(day.date).toLocaleDateString()}</td>
                                        <td>{day.clicks || 0}</td>
                                        <td>{day.conversions || 0}</td>
                                        <td>
                                            {day.clicks > 0 ? 
                                                ((parseFloat(day.conversions) / day.clicks) * 100).toFixed(2) : 
                                                0
                                            }%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceDashboard;
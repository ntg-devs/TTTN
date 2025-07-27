const db = require('../models');
const { Op } = require('sequelize');
const XLSX = require('xlsx');

const exportAffiliateData = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate, kolId } = req.query;
    
    // Build filter conditions
    const whereCondition = {};
    if (kolId) {
      whereCondition.kolId = kolId;
    }
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter[Op.between] = [new Date(startDate), new Date(endDate)];
    } else if (startDate || endDate) {
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
    }
    

    
    // Format data for export
    const exportData = affiliateData.map(item => ({
      'Transaction Date': item.created_at ? new Date(item.created_at).toLocaleDateString() : '',
      'KOL Name': item.kol ? `${item.kol.firstName || ''} ${item.kol.lastName || ''}`.trim() : '',
      'KOL Tier': item.kol?.kol_tier || '',
      'Commission Rate': item.rate ? `${(item.rate * 100).toFixed(1)}%` : '',
      'Product Name': item.affiliateLink?.product?.name || '',
      'Product ID': item.affiliateLink?.product?.id || '',
      'Order ID': item.order?.id || '',
      'Commission Amount': parseFloat(item.amount || 0).toFixed(2),
      'Status': item.status || '',
      'Link ID': item.link_id || ''
    }));
    
    if (format === 'csv') {
      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      let csvContent = headers.join(',') + '\n';
      
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        });
        csvContent += values.join(',') + '\n';
      });
      
      // Set headers for download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=affiliate_data_${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.send(csvContent);
    } else if (format === 'excel') {
      // Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Affiliate Data');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=affiliate_data_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      return res.send(excelBuffer);
    } else {
      return res.status(400).json({ 
        errCode: 1,
        errMessage: 'Unsupported format. Use csv or excel.' 
      });
    }
  } catch (error) {
    console.error('Error exporting affiliate data:', error);
    return res.status(500).json({ 
      errCode: -1,
      errMessage: 'Error from server',
      details: error.message 
    });
  }
};

const exportKolPerformance = async (req, res) => {
  try {
    const { format = 'csv', startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter[Op.between] = [new Date(startDate), new Date(endDate)];
    } else if (startDate || endDate) {
      if (startDate) dateFilter[Op.gte] = new Date(startDate);
      if (endDate) dateFilter[Op.lte] = new Date(endDate);
    }
    
    
    // Get additional statistics from affiliate links
    const linkStats = await db.AffiliateLink.findAll({
      where: {
        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
      },
      attributes: [
        'kolId',
        [db.sequelize.fn('COUNT', '*'), 'totalLinks'],
        [db.sequelize.fn('SUM', db.sequelize.col('clickCount')), 'totalClicks'],
        [db.sequelize.fn('SUM', db.sequelize.col('conversions')), 'totalConversions'],
        [db.sequelize.fn('SUM', db.sequelize.col('revenue')), 'totalRevenue']
      ],
      group: ['kolId']
    });
    
    // Combine the data
    const linkStatsMap = {};
    linkStats.forEach(stat => {
      linkStatsMap[stat.kolId] = stat.dataValues;
    });
    
    // Format data for export
    const exportData = kolPerformance.map(item => {
      const linkData = linkStatsMap[item.kolId] || {};
      const totalClicks = parseInt(linkData.totalClicks) || 0;
      const totalConversions = parseInt(linkData.totalConversions) || 0;
      const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';
      
      return {
        'KOL Name': item.kol ? `${item.kol.firstName || ''} ${item.kol.lastName || ''}`.trim() : '',
        'KOL ID': item.kol?.id || '',
        'KOL Tier': item.kol?.kol_tier || '',
        'Commission Rate': item.kol?.kol_commission_rate ? `${(item.kol.kol_commission_rate * 100).toFixed(1)}%` : '',
        'Total Sales': parseFloat(item.kol?.total_sales || 0).toFixed(2),
        'Total Links': parseInt(linkData.totalLinks) || 0,
        'Total Clicks': totalClicks,
        'Total Conversions': totalConversions,
        'Conversion Rate': `${conversionRate}%`,
        'Total Revenue': parseFloat(linkData.totalRevenue || 0).toFixed(2),
        'Transaction Count': parseInt(item.dataValues.transactionCount) || 0,
        'Total Commission': parseFloat(item.dataValues.totalCommission || 0).toFixed(2),
        'Avg Commission Rate': item.dataValues.avgCommissionRate ? `${(parseFloat(item.dataValues.avgCommissionRate) * 100).toFixed(1)}%` : ''
      };
    });
    
    if (format === 'csv') {
      // Create CSV content
      const headers = Object.keys(exportData[0] || {});
      let csvContent = headers.join(',') + '\n';
      
      exportData.forEach(row => {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes in CSV
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        });
        csvContent += values.join(',') + '\n';
      });
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=kol_performance_${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.send(csvContent);
    } else if (format === 'excel') {
      // Create Excel workbook
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'KOL Performance');
      
      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      // Set headers for download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=kol_performance_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      return res.send(excelBuffer);
    } else {
      return res.status(400).json({ 
        errCode: 1,
        errMessage: 'Unsupported format. Use csv or excel.' 
      });
    }
  } catch (error) {
    console.error('Error exporting KOL performance data:', error);
    return res.status(500).json({ 
      errCode: -1,
      errMessage: 'Error from server',
      details: error.message 
    });
  }
};

module.exports = {
  exportAffiliateData,
  exportKolPerformance
}; 
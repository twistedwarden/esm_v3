import React, { useState, useEffect } from 'react';
import { RefreshCw, BarChart3, Download } from 'lucide-react';
import { getMonitoringServiceUrl } from '../../../../../config/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import AnalyticsCharts from './AnalyticsCharts';
import AIInsightsPanel from '../AIInsightsPanel';

const AnalyticsReport = () => {
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

            // Fetch analytics chart data from monitoring service
            const analyticsResponse = await fetch(getMonitoringServiceUrl('/api/analytics/analytics-charts'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!analyticsResponse.ok) {
                throw new Error(`HTTP error! status: ${analyticsResponse.status}`);
            }

            const analyticsData = await analyticsResponse.json();

            if (analyticsData.success) {
                setChartData(analyticsData.data || {});
            } else {
                throw new Error(analyticsData.message || 'Failed to fetch analytics data');
            }
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            // Set empty data on error
            setChartData({});
        } finally {
            setLoading(false);
        }
    };


    const handleExportPDF = async () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        const dateStr = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Professional Header with blue banner
        doc.setFillColor(30, 64, 175);
        doc.rect(0, 0, pageWidth, 45, 'F');

        // Main Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Education & Scholarship Management System', pageWidth / 2, 15, { align: 'center' });

        // Subtitle
        doc.setFontSize(16);
        doc.setFont('helvetica', 'normal');
        doc.text('Analytics Report', pageWidth / 2, 25, { align: 'center' });

        // Date
        doc.setFontSize(9);
        doc.text(`Generated: ${dateStr}`, pageWidth / 2, 35, { align: 'center' });

        let startY = 55;

        // Fetch AI Insights for the report
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
            const insightsResponse = await fetch(getMonitoringServiceUrl('/api/analytics/ai/insights'), {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (insightsResponse.ok) {
                const insightsData = await insightsResponse.json();

                // AI Highlights Section
                if (insightsData.insights?.highlights && insightsData.insights.highlights.length > 0) {
                    // Section header with background
                    doc.setFillColor(240, 245, 255);
                    doc.rect(margin, startY - 5, contentWidth, 10, 'F');

                    doc.setTextColor(30, 64, 175);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('AI Strategic Highlights', margin + 2, startY + 2);

                    startY += 12;
                    doc.setTextColor(0, 0, 0);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');

                    insightsData.insights.highlights.forEach((highlight, index) => {
                        // Check if we need a new page before adding content
                        if (startY > pageHeight - 30) {
                            doc.addPage();
                            startY = 20;
                        }

                        const bulletNum = `${index + 1}.`;
                        const bulletText = highlight;

                        // Set font to normal to ensure calculation uses correct weight
                        doc.setFont('helvetica', 'normal');

                        // Reduce width to ensure clean wrapping and no stretching
                        const textWidth = contentWidth - 25;
                        const splitText = doc.splitTextToSize(bulletText, textWidth);

                        // Draw bullet number
                        doc.setFont('helvetica', 'bold');
                        doc.text(bulletNum, margin + 5, startY);

                        // Draw bullet text
                        // CRITICAL: Simply draw the pre-split text array. 
                        // Do not pass maxWidth/align, or jsPDF will try to re-wrap/justify it.
                        doc.setFont('helvetica', 'normal');
                        doc.text(splitText, margin + 18, startY);

                        // Optimized spacing: 5.5 per line (approx 1.5x spacing) + 4 padding between items
                        startY += (splitText.length * 5.5) + 4;
                    });
                    startY += 10;
                }

                // Executive Summary Section
                if (insightsData.insights?.summary) {
                    if (startY > pageHeight - 60) {
                        doc.addPage();
                        startY = 20;
                    }

                    // Section header with background
                    doc.setFillColor(240, 245, 255);
                    doc.rect(margin, startY - 5, contentWidth, 10, 'F');

                    doc.setTextColor(30, 64, 175);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Executive Summary', margin + 2, startY + 2);

                    startY += 12;
                    doc.setTextColor(60, 60, 60);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');

                    const summaryText = doc.splitTextToSize(insightsData.insights.summary, contentWidth - 10);
                    doc.text(summaryText, margin + 5, startY);
                    startY += (summaryText.length * 6) + 12;
                }

                // Recommendations Section
                if (insightsData.insights?.recommendations?.length > 0) {
                    if (startY > pageHeight - 80) {
                        doc.addPage();
                        startY = 20;
                    }

                    // Section header with background
                    doc.setFillColor(240, 245, 255);
                    doc.rect(margin, startY - 5, contentWidth, 10, 'F');

                    doc.setTextColor(30, 64, 175);
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Strategic Recommendations', margin + 2, startY + 2);

                    startY += 10;

                    const recData = insightsData.insights.recommendations.map(r => [
                        r.priority.toUpperCase(),
                        r.area.replace(/_/g, ' ').toUpperCase(),
                        r.action
                    ]);

                    autoTable(doc, {
                        startY: startY,
                        head: [['Priority', 'Area', 'Recommendation']],
                        body: recData,
                        headStyles: {
                            fillColor: [30, 64, 175],
                            textColor: [255, 255, 255],
                            fontSize: 10,
                            fontStyle: 'bold',
                            halign: 'center'
                        },
                        styles: {
                            fontSize: 9,
                            cellPadding: 5,
                            lineColor: [200, 200, 200],
                            lineWidth: 0.1
                        },
                        columnStyles: {
                            0: { cellWidth: 25, fontStyle: 'bold', halign: 'center', fillColor: [250, 250, 250] },
                            1: { cellWidth: 40, fontStyle: 'bold' },
                            2: { cellWidth: 'auto' }
                        },
                        alternateRowStyles: { fillColor: [248, 250, 252] },
                        margin: { left: margin, right: margin }
                    });

                    startY = doc.lastAutoTable.finalY + 15;
                }
            }
        } catch (error) {
            console.error('Error fetching AI insights for PDF:', error);
        }

        // Chart Data Summary
        if (chartData && Object.keys(chartData).length > 0) {
            // Check if we need a new page
            if (startY > pageHeight - 100) {
                doc.addPage();
                startY = 20;
            }

            // Section header
            doc.setFillColor(240, 245, 255);
            doc.rect(margin, startY - 5, contentWidth, 10, 'F');

            doc.setTextColor(30, 64, 175);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Analytics Data Summary', margin + 2, startY + 2);

            startY += 15;

            // Program Distribution
            if (chartData.programDistribution?.length > 0) {
                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Program Distribution', margin, startY);
                startY += 8;

                const programData = chartData.programDistribution.map(item => [
                    item.name || 'Unknown',
                    item.value || 0,
                    `${item.percentage || 0}%`
                ]);

                autoTable(doc, {
                    startY: startY,
                    head: [['Program', 'Students', 'Percentage']],
                    body: programData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [59, 130, 246],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 9, cellPadding: 4 },
                    columnStyles: {
                        1: { halign: 'center' },
                        2: { halign: 'center', fontStyle: 'bold' }
                    },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    margin: { left: margin, right: margin }
                });

                startY = doc.lastAutoTable.finalY + 12;
            }

            // Year Level Distribution
            if (chartData.yearLevelDistribution?.length > 0) {
                if (startY > pageHeight - 80) {
                    doc.addPage();
                    startY = 20;
                }

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('Year Level Distribution', margin, startY);
                startY += 8;

                const yearData = chartData.yearLevelDistribution.map(item => [
                    item.name || 'Unknown',
                    item.value || 0,
                    `${item.percentage || 0}%`
                ]);

                autoTable(doc, {
                    startY: startY,
                    head: [['Year Level', 'Students', 'Percentage']],
                    body: yearData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [139, 92, 246],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 9, cellPadding: 4 },
                    columnStyles: {
                        1: { halign: 'center' },
                        2: { halign: 'center', fontStyle: 'bold' }
                    },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    margin: { left: margin, right: margin }
                });

                startY = doc.lastAutoTable.finalY + 12;
            }

            // GPA Distribution
            if (chartData.gpaDistribution?.length > 0) {
                if (startY > pageHeight - 80) {
                    doc.addPage();
                    startY = 20;
                }

                doc.setTextColor(0, 0, 0);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('GPA Distribution', margin, startY);
                startY += 8;

                const gpaData = chartData.gpaDistribution.map(item => [
                    item.name || 'Unknown',
                    item.value || 0,
                    `${item.percentage || 0}%`
                ]);

                autoTable(doc, {
                    startY: startY,
                    head: [['Grade Range', 'Students', 'Percentage']],
                    body: gpaData,
                    theme: 'grid',
                    headStyles: {
                        fillColor: [16, 185, 129],
                        textColor: [255, 255, 255],
                        fontSize: 10,
                        fontStyle: 'bold'
                    },
                    styles: { fontSize: 9, cellPadding: 4 },
                    columnStyles: {
                        1: { halign: 'center' },
                        2: { halign: 'center', fontStyle: 'bold' }
                    },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    margin: { left: margin, right: margin }
                });
            }
        }

        // Add footer to all pages
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Page ${i} of ${pageCount}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
            doc.text(
                'Government Scholarship Management System',
                margin,
                pageHeight - 10
            );
        }

        // Save the PDF
        doc.save(`Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Comprehensive analytics and AI-powered insights
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchAnalyticsData}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export PDF</span>
                    </button>
                </div>
            </div>

            {/* AI Insights Panel */}
            <AIInsightsPanel />

            {/* Analytics Charts */}
            {loading ? (
                <div className="flex items-center justify-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-center">
                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                        <p className="text-slate-600 dark:text-slate-400">Loading analytics data...</p>
                    </div>
                </div>
            ) : (
                <AnalyticsCharts chartData={chartData} />
            )}
        </div>
    );
};

export default AnalyticsReport;

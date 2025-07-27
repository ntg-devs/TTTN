import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { registerKol, getKolStatus } from '../../../services/kolService';
import { useNavigate } from 'react-router-dom';
import './KolRegistrationForm.scss';

/**
 * Component Form Đăng Ký KOL
 * Cho phép người dùng đăng ký làm KOL bằng cách cung cấp liên kết mạng xã hội và tài liệu nhận dạng
 * 
 * Yêu cầu:
 * 1.1 - Hiển thị form để nhập liên kết mạng xã hội và tải lên tài liệu nhận dạng
 * 1.2 - Xác thực rằng tất cả các trường bắt buộc đã được hoàn thành
 */
const KolRegistrationForm = () => {
    const navigate = useNavigate();
    
    // Dữ liệu người dùng từ local storage
    const [userData, setUserData] = useState(null);
    
    // Trạng thái form - thay đổi cấu trúc social media links
    const [socialMediaLinks, setSocialMediaLinks] = useState([]);
    
    const [identificationDocument, setIdentificationDocument] = useState({
        documentType: 'nationalId',
        documentNumber: '',
        documentImage: null
    });
    
    // Trạng thái xác thực form
    const [errors, setErrors] = useState({});
    
    // Trạng thái loading
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Trạng thái đồng ý điều khoản
    const [agreeTerms, setAgreeTerms] = useState(false);
    
    // Kiểm tra xem người dùng đã là KOL hoặc có đơn đăng ký đang chờ xử lý
    const [existingApplication, setExistingApplication] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Danh sách các nền tảng mạng xã hội có sẵn
    const availablePlatforms = [
        { value: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/tênngườidùng' },
        { value: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/tênngườidùng' },
        { value: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@tênngườidùng' },
        { value: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/c/tênkênh' },
        { value: 'twitter', label: 'Twitter', placeholder: 'https://twitter.com/tênngườidùng' },
        { value: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/tênngườidùng' },
        { value: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/tênngườidùng' },
        { value: 'snapchat', label: 'Snapchat', placeholder: 'tênngườidùng' },
        { value: 'telegram', label: 'Telegram', placeholder: '@tênngườidùng' },
        { value: 'other', label: 'Khác', placeholder: 'https://mạngxãhộikhác.com/tênngườidùng' }
    ];
    
    // Lấy dữ liệu người dùng và kiểm tra trạng thái đơn đăng ký khi component mount
    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            try {
                // Lấy dữ liệu người dùng từ local storage
                const user = JSON.parse(localStorage.getItem('userData'));
                
                if (!isMounted) return;
                setUserData(user);
                
                if (!user) {
                    // Chuyển hướng đến trang đăng nhập nếu chưa đăng nhập
                    toast.error('Vui lòng đăng nhập để đăng ký làm KOL');
                    navigate('/login');
                    return;
                }
                
                // Kiểm tra xem người dùng đã có đơn đăng ký KOL chưa
                const response = await getKolStatus();
                
                if (!isMounted) return;
                
                if (response && response.data.hasApplied) {
                    setExistingApplication(response.data);
                    
                    // Nếu đơn đăng ký được chấp thuận, chuyển hướng đến trang KOL dashboard
                    if (response.data.status === 'approved') {
                        navigate('/user/kol/dashboard');
                    }
                    
                    // Nếu đơn đăng ký đang chờ xử lý, hiển thị thông tin đã gửi
                    if (response.data.status === 'pending') {
                        toast.info('Đơn đăng ký KOL của bạn đang được xem xét. Dưới đây là thông tin bạn đã gửi:');
                        
                        // Hiển thị thông tin social media links đã gửi
                        if (response.data.socialMediaLinks) {
                            try {
                                const socialLinks = typeof response.data.socialMediaLinks === 'string' 
                                    ? JSON.parse(response.data.socialMediaLinks) 
                                    : response.data.socialMediaLinks;
                                
                                const newLinks = Object.entries(socialLinks)
                                    .filter(([_, url]) => url && url.trim() !== '')
                                    .map(([platform, url]) => ({
                                        id: Date.now() + Math.random(),
                                        platform,
                                        url: url.trim()
                                    }));
                                setSocialMediaLinks(newLinks);
                            } catch (error) {
                                console.error('Lỗi khi parse social media links:', error);
                            }
                        }
                        
                        // Hiển thị thông tin tài liệu nhận dạng đã gửi
                        if (response.data.identificationDocument) {
                            try {
                                const docData = typeof response.data.identificationDocument === 'string' 
                                    ? JSON.parse(response.data.identificationDocument) 
                                    : response.data.identificationDocument;
                                
                                setIdentificationDocument(prev => ({
                                    ...prev,
                                    documentType: docData.documentType || 'nationalId',
                                    documentNumber: docData.documentNumber || '',
                                    documentImage: docData.documentImage || null
                                }));
                            } catch (error) {
                                console.error('Lỗi khi parse identification document:', error);
                            }
                        }
                    }
                    
                    // Nếu đơn đăng ký bị từ chối, điền sẵn form với dữ liệu trước đó
                    if (response.data.status === 'rejected') {
                        if (response.data.socialMediaLinks) {
                            // Chuyển đổi từ object sang array format mới
                            const oldLinks = typeof response.data.socialMediaLinks === 'string' 
                                ? JSON.parse(response.data.socialMediaLinks) 
                                : response.data.socialMediaLinks;
                            
                            const newLinks = Object.entries(oldLinks)
                                .filter(([_, url]) => url && url.trim() !== '')
                                .map(([platform, url]) => ({
                                    id: Date.now() + Math.random(),
                                    platform,
                                    url: url.trim()
                                }));
                            setSocialMediaLinks(newLinks);
                        }
                        
                        if (response.data.identificationDocument) {
                            const docData = typeof response.data.identificationDocument === 'string' 
                                ? JSON.parse(response.data.identificationDocument) 
                                : response.data.identificationDocument;
                            
                            setIdentificationDocument(prev => ({
                                ...prev,
                                documentType: docData.documentType || 'nationalId',
                                documentNumber: docData.documentNumber || '',
                                // Không điền sẵn hình ảnh vì cần tải lên lại
                            }));
                        }
                        
                        toast.warning('Đơn đăng ký trước của bạn đã bị từ chối. Bạn có thể gửi đơn đăng ký mới.');
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error('Lỗi khi lấy trạng thái KOL:', error);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        
        fetchData();
        
        // Cleanup function
        return () => {
            isMounted = false;
        };
    }, []); // Empty dependency array để chỉ chạy 1 lần khi mount
    
    // Thêm liên kết mạng xã hội mới
    const addSocialMediaLink = () => {
        const newLink = {
            id: Date.now() + Math.random(),
            platform: '',
            url: ''
        };
        setSocialMediaLinks(prev => [...prev, newLink]);
    };
    
    // Xóa liên kết mạng xã hội
    const removeSocialMediaLink = (id) => {
        setSocialMediaLinks(prev => prev.filter(link => link.id !== id));
        // Xóa lỗi khi xóa link
        if (errors.socialMedia) {
            setErrors(prev => ({ ...prev, socialMedia: null }));
        }
    };
    
    // Xử lý thay đổi liên kết mạng xã hội
    const handleSocialMediaChange = (id, field, value) => {
        setSocialMediaLinks(prev => 
            prev.map(link => 
                link.id === id ? { ...link, [field]: value } : link
            )
        );
        
        // Xóa lỗi khi người dùng bắt đầu nhập
        if (errors.socialMedia) {
            setErrors(prev => ({ ...prev, socialMedia: null }));
        }
    };
    
    // Xử lý thay đổi tài liệu nhận dạng
    const handleDocumentChange = (e) => {
        const { name, value } = e.target;
        setIdentificationDocument(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Xóa lỗi khi người dùng thay đổi
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };
    
    // Xử lý tải lên hình ảnh tài liệu
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Xác thực kích thước file (tối đa 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setErrors(prev => ({
                    ...prev,
                    documentImage: 'Kích thước file phải nhỏ hơn 5MB'
                }));
                return;
            }
            
            // Xác thực loại file
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    documentImage: 'Chỉ chấp nhận file JPG, JPEG và PNG'
                }));
                return;
            }
            
            // Chuyển đổi sang base64 để xem trước và gửi
            const reader = new FileReader();
            reader.onloadend = () => {
                setIdentificationDocument(prev => ({
                    ...prev,
                    documentImage: reader.result
                }));
                
                // Xóa lỗi khi tải lên hình ảnh hợp lệ
                if (errors.documentImage) {
                    setErrors(prev => ({ ...prev, documentImage: null }));
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Xử lý thay đổi đồng ý điều khoản
    const handleTermsChange = (e) => {
        setAgreeTerms(e.target.checked);
    };
    
    // Xác thực định dạng URL
    const isValidUrl = (url) => {
        if (!url) return true; // URL trống được phép (sẽ được xác thực riêng)
        try {
            new URL(url);
            return true;
        } catch (e) {
            return false;
        }
    };
    
    // Xác thực form
    const validateForm = () => {
        const newErrors = {};
        
        // Xác thực ít nhất một liên kết mạng xã hội được cung cấp
        const validLinks = socialMediaLinks.filter(link => 
            link.platform && link.url && link.url.trim() !== ''
        );
        
        if (validLinks.length === 0) {
            newErrors.socialMedia = 'Cần ít nhất một liên kết mạng xã hội';
        }
        
        // Xác thực từng liên kết
        socialMediaLinks.forEach((link, index) => {
            if (link.platform && link.url && link.url.trim() !== '') {
                if (!isValidUrl(link.url)) {
                    newErrors[`socialMedia_${index}`] = 'Vui lòng nhập URL hợp lệ';
                }
            }
        });
        
        // Xác thực loại tài liệu
        if (!identificationDocument.documentType) {
            newErrors.documentType = 'Loại tài liệu là bắt buộc';
        }
        
        // Xác thực số tài liệu
        if (!identificationDocument.documentNumber.trim()) {
            newErrors.documentNumber = 'Số tài liệu là bắt buộc';
        }
        
        // Xác thực hình ảnh tài liệu
        if (!identificationDocument.documentImage) {
            newErrors.documentImage = 'Hình ảnh tài liệu là bắt buộc';
        }
        
        // Xác thực đồng ý điều khoản
        if (!agreeTerms) {
            newErrors.agreeTerms = 'Bạn phải đồng ý với điều khoản và điều kiện';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    // Xử lý gửi form
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Xác thực form
        if (!validateForm()) {
            // Cuộn đến lỗi đầu tiên
            const firstError = document.querySelector('.error-message');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Chuyển đổi social media links từ array sang object format cho API
            const socialMediaObject = {};
            socialMediaLinks.forEach(link => {
                if (link.platform && link.url && link.url.trim() !== '') {
                    socialMediaObject[link.platform] = link.url.trim();
                }
            });
            
            // Chuẩn bị dữ liệu cho API
            const registrationData = {
                socialMediaLinks: socialMediaObject,
                identificationDocument
            };
            
            // Gọi API để đăng ký KOL
            const response = await registerKol(registrationData);
            console.log(response);
            
            if (response && response.errCode === 0) {
                toast.success('Đơn đăng ký KOL đã được gửi thành công!');
                // Chuyển hướng đến trang trạng thái
                navigate(`/user/kol/status/${userData.id}`);
            } else {
                
                toast.error(response?.errMessage || 'Không thể gửi đơn đăng ký KOL');
            }
        } catch (error) {
            console.error('Lỗi khi gửi đơn đăng ký KOL:', error);
            
            // Xử lý các trường hợp lỗi cụ thể
            if (error.response && error.response.data) {
                const { errCode, errMessage } = error.response.data;
                
                if (errCode === 2) {
                    toast.warning(errMessage); // Đã có đơn đăng ký đang chờ xử lý
                    navigate(`/user/kol/status/${userData.id}`);
                } else {
                    toast.error(errMessage || 'Đã xảy ra lỗi khi gửi đơn đăng ký của bạn');
                }
            } else {
                toast.error('Đã xảy ra lỗi khi gửi đơn đăng ký của bạn');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Hiển thị trạng thái loading khi kiểm tra trạng thái đơn đăng ký
    if (isLoading) {
        return (
            <div className="kol-registration-container">
                <div className="kol-registration-header">
                    <h2>Đăng Ký KOL</h2>
                    <p>Đang tải thông tin của bạn...</p>
                </div>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="kol-registration-container">
            <div className="kol-registration-header">
                <h2>Đăng Ký KOL</h2>
                <p>Trở thành Key Opinion Leader và kiếm hoa hồng bằng cách quảng cáo sản phẩm của chúng tôi</p>
                
                {existingApplication && existingApplication.status === 'pending' && (
                    <div className="pending-application-notice">
                        <h4>Đơn Đăng Ký Đang Được Xem Xét</h4>
                        <p>Đơn đăng ký KOL của bạn đã được gửi và đang được xem xét bởi đội ngũ của chúng tôi.</p>
                        <p>Ngày gửi: {new Date(existingApplication.applicationDate).toLocaleDateString('vi-VN')}</p>
                        <p>Trạng thái: <span className="status-pending">Đang chờ xử lý</span></p>
                    </div>
                )}
                
                {existingApplication && existingApplication.status === 'rejected' && (
                    <div className="previous-application-notice">
                        <p>Đơn đăng ký trước của bạn đã bị từ chối. Lý do: {existingApplication.reason || 'Không được chỉ định'}</p>
                        <p>Bạn có thể gửi đơn đăng ký mới với thông tin đã cập nhật.</p>
                    </div>
                )}
            </div>
            
            {/* Hiển thị thông tin đã gửi dạng bảng khi đang pending */}
            {existingApplication && existingApplication.status === 'pending' ? (
                <div className="submitted-info-container">
                    <div className="info-section">
                        <h3>Thông Tin Đã Gửi</h3>
                        
                        <div className="info-table">
                            <div className="table-section">
                                <h4>Liên Kết Mạng Xã Hội</h4>
                                <table className="info-table-content">
                                    <thead>
                                        <tr>
                                            <th>Nền Tảng</th>
                                            <th>Liên Kết</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            try {
                                                const socialLinks = typeof existingApplication.socialMediaLinks === 'string' 
                                                    ? JSON.parse(existingApplication.socialMediaLinks) 
                                                    : existingApplication.socialMediaLinks;
                                                
                                                return Object.entries(socialLinks)
                                                    .filter(([_, url]) => url && url.trim() !== '')
                                                    .map(([platform, url]) => {
                                                        const platformInfo = availablePlatforms.find(p => p.value === platform);
                                                        return (
                                                            <tr key={platform}>
                                                                <td>{platformInfo ? platformInfo.label : platform}</td>
                                                                <td>
                                                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                                                        {url}
                                                                    </a>
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                            } catch (error) {
                                                return (
                                                    <tr>
                                                        <td colSpan="2">Không có dữ liệu</td>
                                                    </tr>
                                                );
                                            }
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="table-section">
                                <h4>Thông Tin Tài Liệu Nhận Dạng</h4>
                                <table className="info-table-content">
                                    <tbody>
                                        {(() => {
                                            try {
                                                const docData = typeof existingApplication.identificationDocument === 'string' 
                                                    ? JSON.parse(existingApplication.identificationDocument) 
                                                    : existingApplication.identificationDocument;
                                                
                                                const documentTypeLabels = {
                                                    'nationalId': 'Chứng Minh Nhân Dân',
                                                    'passport': 'Hộ Chiếu',
                                                    'driverLicense': 'Giấy Phép Lái Xe'
                                                };
                                                
                                                return (
                                                    <>
                                                        <tr>
                                                            <td><strong>Loại Tài Liệu:</strong></td>
                                                            <td>{documentTypeLabels[docData.documentType] || docData.documentType}</td>
                                                        </tr>
                                                        <tr>
                                                            <td><strong>Số Tài Liệu:</strong></td>
                                                            <td>{docData.documentNumber}</td>
                                                        </tr>
                                                        {docData.documentImage && (
                                                            <tr>
                                                                <td><strong>Hình Ảnh:</strong></td>
                                                                <td>
                                                                    <img 
                                                                        src={docData.documentImage} 
                                                                        alt="Tài liệu đã gửi" 
                                                                        className="document-preview-small"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                );
                                            } catch (error) {
                                                return (
                                                    <tr>
                                                        <td colSpan="2">Không có dữ liệu</td>
                                                    </tr>
                                                );
                                            }
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Hiển thị form đăng ký khi chưa có đơn hoặc đơn bị từ chối */
                <form className="kol-registration-form" onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Liên Kết Mạng Xã Hội</h3>
                        <p className="section-description">
                            Vui lòng cung cấp liên kết đến hồ sơ mạng xã hội của bạn. Cần ít nhất một liên kết.
                        </p>
                        
                        <div className="social-media-links-container">
                            {socialMediaLinks.map((link, index) => (
                                <div key={link.id} className="social-media-link-item">
                                    <div className="link-inputs">
                                        <div className="form-group platform-select">
                                            <select
                                                value={link.platform}
                                                onChange={(e) => handleSocialMediaChange(link.id, 'platform', e.target.value)}
                                                className="form-control"
                                            >
                                                <option value="">Chọn nền tảng</option>
                                                {availablePlatforms.map(platform => (
                                                    <option key={platform.value} value={platform.value}>
                                                        {platform.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        
                                        <div className="form-group url-input">
                                            <input
                                                type="url"
                                                value={link.url}
                                                onChange={(e) => handleSocialMediaChange(link.id, 'url', e.target.value)}
                                                placeholder={link.platform ? 
                                                    availablePlatforms.find(p => p.value === link.platform)?.placeholder || 
                                                    'Nhập liên kết' : 
                                                    'Chọn nền tảng trước'
                                                }
                                                className={`form-control ${errors[`socialMedia_${index}`] ? 'is-invalid' : ''}`}
                                            />
                                            {errors[`socialMedia_${index}`] && (
                                                <div className="error-message">{errors[`socialMedia_${index}`]}</div>
                                            )}
                                        </div>
                                        
                                        <button
                                            type="button"
                                            onClick={() => removeSocialMediaLink(link.id)}
                                            className="btn-remove-link"
                                            title="Xóa liên kết này"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            
                            <button
                                type="button"
                                onClick={addSocialMediaLink}
                                className="btn-add-link"
                            >
                                <i className="fas fa-plus"></i> Thêm Liên Kết Mạng Xã Hội
                            </button>
                        </div>
                        
                        {errors.socialMedia && (
                            <div className="error-message">{errors.socialMedia}</div>
                        )}
                    </div>
                    
                    <div className="form-section">
                        <h3>Tài Liệu Nhận Dạng</h3>
                        <p className="section-description">
                            Vui lòng cung cấp chi tiết tài liệu nhận dạng của bạn để xác minh.
                        </p>
                        
                        <div className="form-group">
                            <label htmlFor="documentType">Loại Tài Liệu</label>
                            <select
                                id="documentType"
                                name="documentType"
                                value={identificationDocument.documentType}
                                onChange={handleDocumentChange}
                                className={`form-control ${errors.documentType ? 'is-invalid' : ''}`}
                            >
                                <option value="nationalId">Chứng Minh Nhân Dân</option>
                                <option value="passport">Hộ Chiếu</option>
                                <option value="driverLicense">Giấy Phép Lái Xe</option>
                            </select>
                            {errors.documentType && (
                                <div className="error-message">{errors.documentType}</div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="documentNumber">Số Tài Liệu</label>
                            <input
                                type="text"
                                id="documentNumber"
                                name="documentNumber"
                                value={identificationDocument.documentNumber}
                                onChange={handleDocumentChange}
                                placeholder="Nhập số tài liệu của bạn"
                                className={`form-control ${errors.documentNumber ? 'is-invalid' : ''}`}
                            />
                            {errors.documentNumber && (
                                <div className="error-message">{errors.documentNumber}</div>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="documentImage">Hình Ảnh Tài Liệu</label>
                            <input
                                type="file"
                                id="documentImage"
                                name="documentImage"
                                onChange={handleImageUpload}
                                accept="image/jpeg,image/png,image/jpg"
                                className={`form-control ${errors.documentImage ? 'is-invalid' : ''}`}
                            />
                            <small className="form-text text-muted">
                                Tải lên hình ảnh rõ ràng của tài liệu. Kích thước tối đa: 5MB. Định dạng được chấp nhận: JPG, JPEG, PNG.
                            </small>
                            {errors.documentImage && (
                                <div className="error-message">{errors.documentImage}</div>
                            )}
                            
                            {identificationDocument.documentImage && (
                                <div className="document-preview">
                                    <img 
                                        src={identificationDocument.documentImage} 
                                        alt="Xem Trước Tài Liệu" 
                                        className="preview-image"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="form-section">
                        <h3>Điều Khoản Và Điều Kiện</h3>
                        <div className="terms-container">
                            <p>Bằng việc gửi đơn đăng ký này, bạn đồng ý với các điều khoản sau:</p>
                            <ul>
                                <li>Bạn sẽ chỉ quảng cáo sản phẩm một cách trung thực và có đạo đức</li>
                                <li>Bạn sẽ tiết lộ mối quan hệ đối tác liên kết với nền tảng của chúng tôi</li>
                                <li>Bạn hiểu rằng hoa hồng dựa trên doanh số thực tế</li>
                                <li>Bạn đồng ý với <a href="/terms" target="_blank" rel="noopener noreferrer">Điều Khoản Dịch Vụ</a> và <a href="/privacy" target="_blank" rel="noopener noreferrer">Chính Sách Bảo Mật</a> của chúng tôi</li>
                            </ul>
                            
                            <div className="form-group">
                                <div className="checkbox-container">
                                    <input
                                        type="checkbox"
                                        id="agreeTerms"
                                        name="agreeTerms"
                                        checked={agreeTerms}
                                        onChange={handleTermsChange}
                                        className={errors.agreeTerms ? 'is-invalid' : ''}
                                    />
                                    <label htmlFor="agreeTerms">Tôi đồng ý với điều khoản và điều kiện</label>
                                </div>
                                {errors.agreeTerms && (
                                    <div className="error-message">{errors.agreeTerms}</div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            type="submit" 
                            className="btn-submit" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Đang Gửi...' : 'Gửi Đơn Đăng Ký'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default KolRegistrationForm;
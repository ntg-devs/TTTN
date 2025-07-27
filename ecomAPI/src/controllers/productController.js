import productService from '../services/productService';
import { handleAffiliateAttribution } from '../middlewares/affiliateAttribution';
import db from '../models';


let createNewProduct = async (req, res) => {
    try {
        let data = await productService.createNewProduct(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getAllProductAdmin = async (req, res) => {
    try {
        let data = await productService.getAllProductAdmin(req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getAllProductUser = async (req, res) => {
    try {
        let data = await productService.getAllProductUser(req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let UnactiveProduct = async (req, res) => {
    try {
        let data = await productService.UnactiveProduct(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let ActiveProduct = async (req, res) => {
    try {
        let data = await productService.ActiveProduct(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getDetailProductById = async (req, res) => {
    try {
        await handleAffiliateAttribution(req, res, async () => {
            if (!req.query.id) {
                return res.status(200).json({
                    errCode: 1,
                    errMessage: "Missing required parameter!",
                });
            }

            let product = await db.Product.findOne({
                where: { id: req.query.id },
                include: [
                    { model: db.Allcode, as: "categoryData" },
                    { model: db.Allcode, as: "brandData" },
                    { model: db.Allcode, as: "statusData" },
                ],
                raw: true,
                nest: true,
            });

            if (!product) {
                return res.status(200).json({
                    errCode: 2,
                    errMessage: "Product not found!",
                });
            }

            let productDetail = await db.ProductDetail.findAll({
                where: { productId: req.query.id },
            });
            product.productDetail = productDetail;

            // Xử lý từng productDetail
            for (let i = 0; i < product.productDetail.length; i++) {
                let detail = product.productDetail[i];

                // Lấy hình ảnh
                if (db.ProductImage) {
                    detail.productImage = await db.ProductImage.findAll({
                        where: { productdetailId: detail.id },
                    });
                    for(let j = 0; j < detail.productImage.length; j++){
                        let productImage = detail.productImage[j];
                        productImage.image = new Buffer(productImage.image, 'base64').toString('binary')
                    }
                }

                // Lấy kích thước
                if (db.ProductDetailSize) {
                    detail.productDetailSize = await db.ProductDetailSize.findAll({
                        where: { productdetailId: detail.id },
                    });

                    // Lấy thông tin sizeData cho từng kích thước
                    if (detail.productDetailSize && detail.productDetailSize.length > 0) {
                        for (let j = 0; j < detail.productDetailSize.length; j++) {
                            let sizeItem = detail.productDetailSize[j];
                            sizeItem.sizeData = await db.Allcode.findOne({
                                where: { code: sizeItem.sizeId },
                            });
                        }
                    }
                }
            }

            return res.status(200).json({
                errCode: 0,
                data: product,
            });
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            errCode: -1,
            errMessage: "Error from server",
        });
    }
};
let updateProduct = async (req, res) => {
    try {
        let data = await productService.updateProduct(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getAllProductDetailById = async (req, res) => {
    try {
        let data = await productService.getAllProductDetailById(req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getAllProductDetailImageById = async (req, res) => {
    try {
        let data = await productService.getAllProductDetailImageById(req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let createNewProductDetail = async (req, res) => {
    try {
        let data = await productService.createNewProductDetail(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let updateProductDetail = async (req, res) => {
    try {
        let data = await productService.updateProductDetail(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getDetailProductDetailById = async (req, res) => {
    try {
        let data = await productService.getDetailProductDetailById(req.query.id);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let createNewProductDetailImage = async (req, res) => {
    try {
        let data = await productService.createNewProductDetailImage(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getDetailProductImageById = async (req, res) => {
    try {
        let data = await productService.getDetailProductImageById(req.query.id);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let updateProductDetailImage = async (req, res) => {
    try {
        let data = await productService.updateProductDetailImage(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let deleteProductDetailImage = async (req, res) => {
    try {
        let data = await productService.deleteProductDetailImage(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let deleteProductDetail = async (req, res) => {
    try {
        let data = await productService.deleteProductDetail(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getAllProductDetailSizeById = async (req, res) => {
    try {
        let data = await productService.getAllProductDetailSizeById(req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let createNewProductDetailSize = async (req, res) => {
    try {
        let data = await productService.createNewProductDetailSize(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getDetailProductDetailSizeById = async (req, res) => {
    try {
        let data = await productService.getDetailProductDetailSizeById(req.query.id);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let updateProductDetailSize = async (req, res) => {
    try {
        let data = await productService.updateProductDetailSize(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let deleteProductDetailSize = async (req, res) => {
    try {
        let data = await productService.deleteProductDetailSize(req.body);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getProductFeature = async (req, res) => {
    try {
        let data = await productService.getProductFeature(req.query.limit);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getProductNew = async (req, res) => {
    try {
        let data = await productService.getProductNew(req.query.limit);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getProductShopCart = async (req, res) => {
    try {
        let data = await productService.getProductShopCart(req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}
let getProductRecommend = async (req, res) => {
    try {
        let data = await productService.getProductRecommend(req.query);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error)
        return res.status(200).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}

/**
 * Get products for KOL affiliate promotion
 * GET /api/products
 * 
 * This endpoint returns products that KOLs can promote through affiliate links
 * with filtering options for better product selection
 */
let getProductsForKOL = async (req, res) => {
    try {
        // Check if user is authenticated and is a KOL
        if (!req.user || !req.user.is_kol || req.user.kol_status !== 'approved') {
            return res.status(403).json({
                errCode: 3,
                errMessage: 'User is not an approved KOL'
            });
        }

        // Get query parameters for filtering and pagination
        const {
            categoryId = 'ALL',
            brandId = 'ALL',
            keyword = '',
            sortBy = 'name',
            sortOrder = 'ASC',
            page = 1,
            limit = 10
        } = req.query;

        // Create filter object for product service
        const filterData = {
            categoryId,
            brandId,
            keyword,
            sortName: sortBy === 'name' ? 'true' : 'false',
            sortPrice: sortBy === 'price' ? 'true' : 'false',
            limit,
            offset: (page - 1) * limit
        };

        // Get products with active status only
        let data = await productService.getAllProductUser(filterData);

        // Format response for KOL needs - include only necessary fields for affiliate promotion
        const formattedProducts = data.data.map(product => ({
            id: product.id,
            name: product.name,
            category: product.categoryData ? product.categoryData.value : null,
            brand: product.brandData ? product.brandData.value : null,
            price: product.price,
            image: product.productDetail && product.productDetail[0] &&
                product.productDetail[0].productImage &&
                product.productDetail[0].productImage[0] ?
                product.productDetail[0].productImage[0].image : null,
            description: product.productDetail && product.productDetail[0] ?
                product.productDetail[0].description : null,
            // Include additional fields useful for promotion
            material: product.material,
            madeby: product.madeby
        }));

        // Calculate pagination info
        const totalPages = Math.ceil(data.count / limit);

        return res.status(200).json({
            errCode: 0,
            errMessage: 'Products retrieved successfully',
            data: {
                products: formattedProducts,
                pagination: {
                    totalItems: data.count,
                    totalPages: totalPages,
                    currentPage: parseInt(page),
                    limit: parseInt(limit)
                }
            }
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            errCode: -1,
            errMessage: 'Error from server'
        })
    }
}

module.exports = {
    createNewProduct: createNewProduct,
    getAllProductAdmin: getAllProductAdmin,
    getAllProductUser: getAllProductUser,
    UnactiveProduct: UnactiveProduct,
    ActiveProduct: ActiveProduct,
    getDetailProductById: getDetailProductById,
    updateProduct: updateProduct,
    getAllProductDetailById: getAllProductDetailById,
    getAllProductDetailImageById: getAllProductDetailImageById,
    createNewProductDetail: createNewProductDetail,
    updateProductDetail: updateProductDetail,
    getDetailProductDetailById: getDetailProductDetailById,
    createNewProductDetailImage: createNewProductDetailImage,
    getDetailProductImageById: getDetailProductImageById,
    updateProductDetailImage: updateProductDetailImage,
    deleteProductDetailImage: deleteProductDetailImage,
    deleteProductDetail: deleteProductDetail,
    getAllProductDetailSizeById: getAllProductDetailSizeById,
    createNewProductDetailSize: createNewProductDetailSize,
    getDetailProductDetailSizeById: getDetailProductDetailSizeById,
    updateProductDetailSize: updateProductDetailSize,
    deleteProductDetailSize: deleteProductDetailSize,
    getProductFeature: getProductFeature,
    getProductNew: getProductNew,
    getProductShopCart: getProductShopCart,
    getProductRecommend: getProductRecommend,
    getProductsForKOL: getProductsForKOL
}
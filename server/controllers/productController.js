import fs from 'fs'
import slugify from 'slugify'
import productModel from '../models/productModel.js'

export const createProductController = async (req, res) => {
	try {
		const { name, description, price, category, quantity } =
			req.fields
		const { photo } = req.files
		//alidation
		switch (true) {
			case !name:
				return res.status(500).send({ error: "Name is Required" })
			case !description:
				return res.status(500).send({ error: "Description is Required" })
			case !price:
				return res.status(500).send({ error: "Price is Required" })
			case !category:
				return res.status(500).send({ error: "Category is Required" })
			case !quantity:
				return res.status(500).send({ error: "Quantity is Required" })
			case photo && photo.size > 1000000:
				return res
					.status(500)
					.send({ error: "photo is Required and should be less then 1mb" })
		}

		const products = new productModel({ ...req.fields, slug: slugify(name) })
		if (photo) {
			products.photo.data = fs.readFileSync(photo.path)
			products.photo.contentType = photo.type
		}
		await products.save()
		res.status(201).send({
			success: true,
			message: "Product Created Successfully",
			products,
		})
	} catch (error) {
		console.log(error)
		res.status(500).send({
			success: false,
			error,
			message: "Error in crearing product",
		})
	}
}

// get all products
export const getProductController = async (req, res) => {
	try {

		const page = parseInt(req.query.page) || 1 // Hozirgi sahifa
		const limit = parseInt(req.query.limit) || 10 // Sahifada nechta mahsulot bo'lishi
		const skip = (page - 1) * limit // Nechta mahsulotni o'tkazib yuborish kerakligini hisoblash

		// Umumiy mahsulotlar sonini olish
		const totalProducts = await productModel.countDocuments({})

		const products = await productModel
			.find({})
			.populate("category")
			.select("-photo")
			.limit(12)
			.sort({ createdAt: -1 })
			.skip(skip) // O'tkazib yuboriladigan mahsulotlar
			.limit(limit) // Nechta mahsulot ko'rsatilishi
		res.status(200).send({
			success: true,
			counTotal: products.length,
			totalProducts, // Umumiy mahsulotlar soni
			totalPages: Math.ceil(totalProducts / limit), // Umumiy sahifalar soni
			currentPage: page, // Hozirgi sahifa
			message: "ALlProducts ",
			products,
		})
	} catch (error) {
		console.log(error)
		res.status(500).send({
			success: false,
			message: "Erorr in getting products",
			error: error.message,
		})
	}
}

// single product

export const getSingleProductController = async (req, res) => {
	try {
		const product = await productModel
			.findOne({ slug: req.params.slug })
			.select("-photo")
			.populate("category")
		res.status(200).send({
			success: true,
			message: "Single Product Fetched",
			product,
		})
	} catch (error) {
		console.log(error)
		res.status(500).send({
			success: false,
			message: "Eror while getitng single product",
			error,
		})
	}
}

// update product
export const updateProductController = async (req, res) => {
	try {
		const { name, description, price, category, quantity, shipping } =
			req.fields
		const { photo } = req.files
		//alidation
		switch (true) {
			case !name:
				return res.status(500).send({ error: "Name is Required" })
			case !description:
				return res.status(500).send({ error: "Description is Required" })
			case !price:
				return res.status(500).send({ error: "Price is Required" })
			case !category:
				return res.status(500).send({ error: "Category is Required" })
			case !quantity:
				return res.status(500).send({ error: "Quantity is Required" })
			case photo && photo.size > 1000000:
				return res
					.status(500)
					.send({ error: "photo is Required and should be less then 1mb" })
		}

		const products = await productModel.findByIdAndUpdate(
			req.params.pid,
			{ ...req.fields, slug: slugify(name) },
			{ new: true }
		)
		if (photo) {
			products.photo.data = fs.readFileSync(photo.path)
			products.photo.contentType = photo.type
		}
		await products.save()
		res.status(201).send({
			success: true,
			message: "Product Updated Successfully",
			products,
		})
	} catch (error) {
		console.log(error)
		res.status(500).send({
			success: false,
			error,
			message: "Error in Updte product",
		})
	}
}

// delete product
export const deleteProductController = async (req, res) => {
	try {
		await productModel.findByIdAndDelete(req.params.pid).select("-photo")
		res.status(200).send({
			success: true,
			message: "Product Deleted successfully",
		})
	} catch (error) {
		console.log(error)
		res.status(500).send({
			success: false,
			message: "Error while deleting product",
			error,
		})
	}
}

// filters product (categoty and price range)
export const productFilterController = async (req, res) => {
	try {
		const { checked, radio } = req.body
		let args = {}
		if (checked.length > 0) args.category = checked
		if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] }
		const products = await productModel.find(args)
		res.status(200).send({
			success: true,
			products,
		})
	} catch (error) {
		console.log(error)
		res.status(400).send({
			success: false,
			message: "Error WHile Filtering Products",
			error,
		})
	}
}

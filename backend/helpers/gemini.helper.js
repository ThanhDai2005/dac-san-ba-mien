import { GoogleGenAI } from "@google/genai";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// System prompt - Train AI với context dự án
const SYSTEM_CONTEXT = `
Bạn là trợ lý ảo thân thiện của Quán Ăn Đặc Sản Ba Miền - nơi hội tụ tinh hoa ẩm thực từ Ba Miền Bắc - Trung - Nam Việt Nam.

## THÔNG TIN QUÁN ĂN
- Tên: Quán Ăn Đặc Sản Ba Miền
- Phong cách: Ẩm thực đặc sản đặc trưng từ 3 miền Bắc - Trung - Nam
- Đặc trưng: Nguyên liệu địa phương chính gốc, công thức truyền thống, hương vị đậm đà bản sắc từng vùng miền
- Giờ hoạt động: 10:00 - 22:30 hàng ngày (kể cả lễ, Tết)
- Địa chỉ: 123 Đường Trần Hưng Đạo, Quận 1, TP. Hồ Chí Minh
- Hotline: 0987 654 321
- Email: contact@dacsanbamienvn.com
- Website: www.dacsanbamienvn.com

## VAI TRÒ CỦA BẠN
1. Tư vấn thực đơn và giới thiệu món ăn phù hợp với khách hàng
2. Hỗ trợ giải đáp thắc mắc về giá cả, thành phần món ăn, khuyến mãi
3. Hướng dẫn quy trình đặt món, thanh toán, giao hàng
4. Hỗ trợ tra cứu đơn hàng và xử lý khiếu nại
5. Kết nối với nhân viên tư vấn khi cần thiết

## QUY TẮC GIAO TIẾP
✅ ĐƯỢC PHÉP:
- Nhiệt tình, thân thiện, lịch sự
- Trả lời chính xác dựa trên dữ liệu thực đơn được cung cấp
- Gợi ý món ăn phù hợp với nhu cầu khách (ngân sách, khẩu vị, dị ứng)
- Giải thích chi tiết thành phần, cách chế biến, giá cả
- Hướng dẫn khách đặt hàng qua website
- Kết nối nhân viên khi khách yêu cầu "Gặp nhân viên" hoặc vấn đề phức tạp

❌ KHÔNG ĐƯỢC PHÉP:
- Cung cấp thông tin sai lệch hoặc bịa đặt món ăn không có trong menu
- Tiết lộ thông tin cá nhân của khách hàng khác
- Xử lý thanh toán trực tiếp (chỉ hướng dẫn)
- Cam kết về thời gian giao hàng cụ thể (chỉ nói "khoảng 30-45 phút")
- Thay đổi giá hoặc tự ý giảm giá

## CÁC TÌNH HUỐNG THƯỜNG GẶP

### 1. Khách hỏi về món ăn
- Giới thiệu chi tiết: tên, mô tả, nguyên liệu, giá, đánh giá
- Gợi ý combo hoặc món tương tự nếu hết hàng
- Hỏi về sở thích, dị ứng để tư vấn chính xác

### 2. Khách muốn đặt hàng
Hướng dẫn: "Để đặt món, anh/chị vui lòng:
1. Vào mục Thực đơn trên website
2. Chọn món → Thêm vào giỏ hàng
3. Kiểm tra giỏ hàng → Thanh toán
4. Điền thông tin giao hàng → Hoàn tất đơn

Hoặc anh/chị có thể gọi hotline 0987 654 321 để đặt hàng qua điện thoại."

### 3. Khách hỏi về khuyến mãi
Trả lời dựa trên dữ liệu promotion (nếu có), nếu không rõ:
"Để biết thông tin khuyến mãi mới nhất, anh/chị vui lòng kiểm tra mục 'Ưu đãi' trên website hoặc liên hệ hotline 0987 654 321 ạ."

### 4. Khách than phiền/khiếu nại
"Em rất xin lỗi về sự bất tiện này. Để xử lý tốt nhất, em xin kết nối anh/chị với bộ phận chăm sóc khách hàng ngay ạ."
→ Gửi tín hiệu ESCALATE_TO_HUMAN

### 5. Khách hỏi về đơn hàng
"Để tra cứu đơn hàng, anh/chị vui lòng:
- Đăng nhập tài khoản → Mục 'Đơn hàng của tôi'
- Hoặc cung cấp mã đơn hàng để em hỗ trợ kiểm tra"

## TÍN HIỆU ĐẶC BIỆT
Khi cần kết nối nhân viên, trả về JSON:
{
  "action": "ESCALATE_TO_HUMAN",
  "reason": "Lý do (khiếu nại/yêu cầu đặc biệt/vấn đề phức tạp)",
  "message": "Tin nhắn gửi khách"
}

## PHONG CÁCH TRẢ LỜI
- Xưng hô: "em" (bot), "anh/chị" (khách)
- Độ dài: 2-4 câu, ngắn gọn, dễ hiểu
- Emoji: Chỉ dùng 🍲🥘🍜🎉 khi giới thiệu món hoặc ưu đãi
- Kết thúc: "Em có thể giúp gì thêm cho anh/chị không ạ?"
`;

/**
 * Lấy context thực đơn từ database để train AI
 */
export const getMenuContext = async () => {
  try {
    const [products, categories] = await Promise.all([
      Product.find({ deleted: false, status: "active" })
        .populate("categoryId", "name")
        .select(
          "name description ingredients price stock averageRating numReviews",
        )
        .lean(),
      Category.find({ deleted: false, status: "active" })
        .select("name slug")
        .lean(),
    ]);

    const menuContext = `
## THỰC ĐƠN HIỆN TẠI

${categories
  .map((cat) => {
    const categoryProducts = products.filter(
      (p) => p.categoryId?._id.toString() === cat._id.toString(),
    );
    if (categoryProducts.length === 0) return "";

    return `
### ${cat.name}
${categoryProducts
  .map(
    (p) => `
- **${p.name}** - ${p.price.toLocaleString("vi-VN")}đ
  Mô tả: ${p.description}
  Nguyên liệu: ${p.ingredients}
  ${p.stock > 0 ? `Còn hàng: ${p.stock}` : "⚠️ HẾT HÀNG"}
  Đánh giá: ${p.averageRating.toFixed(1)}/5 (${p.numReviews} lượt)
`,
  )
  .join("\n")}
`;
  })
  .filter(Boolean)
  .join("\n")}

## LƯU Ý VỀ TỒN KHO
- Món "HẾT HÀNG": Xin lỗi khách, gợi ý món tương tự
- Món còn ít (< 10): Nhắc "Món này sắp hết, anh/chị nên đặt sớm ạ"
`;

    return menuContext;
  } catch (error) {
    console.error("Lỗi khi lấy context thực đơn:", error);
    return "## THỰC ĐƠN HIỆN TẠI\n(Đang tải dữ liệu...)";
  }
};

/**
 * Gửi tin nhắn đến Gemini AI và nhận phản hồi (Sử dụng @google/genai SDK v2.12.0)
 */
export const getChatbotResponse = async (conversationHistory, userMessage) => {
  try {
    const menuContext = await getMenuContext();
    const fullSystemPrompt = SYSTEM_CONTEXT + "\n" + menuContext;

    // 1. Cấu trúc lại History chuẩn theo SDK @google/genai
    // Role bắt buộc là "user" hoặc "model" (không dùng "bot" hay "assistant")
    const geminiHistory = conversationHistory.map((msg) => ({
      role: msg.role === "bot" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // 2. Build contents array cho generateContent API
    // History + user message hiện tại
    const contents = [
      ...geminiHistory,
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    // 3. Gọi generateContent API (cú pháp chuẩn @google/genai v2.12.0)
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents,
      config: {
        systemInstruction: fullSystemPrompt,
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 2048,
      },
    });

    // 4. Lấy nội dung text từ response
    const responseText = response.text;

    // 5. Xử lý logic JSON nếu AI yêu cầu chuyển nhân viên
    if (responseText.includes("ESCALATE_TO_HUMAN")) {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            text: parsed.message,
            action: "ESCALATE_TO_HUMAN",
            reason: parsed.reason,
          };
        }
      } catch (e) {
        // Fallback nếu JSON bị lỗi format
      }
    }

    return {
      text: responseText,
      action: null,
    };
  } catch (error) {
    console.error("Lỗi khi gọi Gemini API:", error);
    return {
      text: "Em xin lỗi, hệ thống đang gặp chút vấn đề. Anh/chị vui lòng thử lại sau hoặc liên hệ hotline 0987 654 321 để được hỗ trợ ngay ạ.",
      action: null,
    };
  }
};

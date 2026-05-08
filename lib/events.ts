/**
 * Utility to check for special Vietnamese holidays and events
 */

interface SpecialEvent {
  id: string;
  name: string;
  themeClass: string;
  imageUrl?: string;
  announcement?: string;
}

export const getCurrentEvent = (): SpecialEvent | null => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1; // 1-12

  // 1. Tết Dương Lịch (Jan 1st)
  if (month === 1 && day === 1) {
    return { id: 'new-year', name: 'Chúc mừng Năm mới', themeClass: 'event-new-year' };
  }

  // 2. Ngày Giải phóng miền Nam (Apr 30th)
  if (month === 4 && day === 30) {
    return { 
      id: 'liberation-day', 
      name: 'Ngày Giải phóng miền Nam', 
      themeClass: 'event-national',
      imageUrl: '/events/30-4.jpg',
      announcement: 'Chào mừng kỷ niệm Ngày Giải phóng miền Nam, Thống nhất đất nước! Toàn thể nhân dân cùng chung vui ngày hội lớn.'
    };
  }

  // 3. Chiến thắng Điện Biên Phủ (May 7th)
  if (month === 5 && (day === 7 || day === 8)) {
    return { 
      id: 'dien-bien-phu', 
      name: 'Kỷ niệm Chiến thắng Điện Biên Phủ', 
      themeClass: 'event-national',
      imageUrl: '/events/7-5.jpg',
      announcement: 'Chào mừng kỷ niệm Chiến thắng Điện Biên Phủ "Lừng lẫy năm châu, chấn động địa cầu"! Tự hào hào khí dân tộc.'
    };
  }

  // 4. Quốc khánh (Sep 2nd)
  if (month === 9 && day === 2) {
    return { 
      id: 'national-day', 
      name: 'Lễ Quốc khánh', 
      themeClass: 'event-national',
      imageUrl: '/events/2-9.jpg',
      announcement: 'Chào mừng ngày Quốc khánh nước Cộng hòa xã hội chủ nghĩa Việt Nam! Việt Nam muôn năm!'
    };
  }

  // 5. Tết Âm Lịch (Simplified check or hardcoded for common years)
  // Note: For a real app, you'd use a lunar calendar library. 
  // Here we'll check for a range or specific years.
  // 2026: Feb 17
  if (now.getFullYear() === 2026 && month === 2 && (day >= 15 && day <= 20)) {
     return { id: 'lunar-new-year', name: 'Chúc mừng năm mới (Tết)', themeClass: 'event-tet' };
  }

  return null;
};

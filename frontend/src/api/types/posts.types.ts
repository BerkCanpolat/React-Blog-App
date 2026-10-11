
export interface BlogPostResponse {
    success: boolean;
    data: BlogPostData;
};

export interface BlogPostData {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    cover_image_url: string;
    status: "draft" | "published";
    views: number;
    is_featured: boolean;
    author_id: number;
    category_id: number;
    published_at: string | null;
    created_at: string;
    updated_at: string;
    author_name: string;
    category_name: string;
    category_slug: string;
    tags: BlogPostTagsData[];
};

export interface BlogPostTagsData {
    id: number;
    name: string;
    slug: string;
}

export interface BlogPostInput {
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string | null;
    status: "draft" | "published";
    isFeatured: boolean;
    categoryId: number;
    tagIds: number[];

}


// POST YAZISI ÇEKMEK İÇİN BİLGİLER
// {
//     "success": true,
//     "data": {
//         "id": 1,
//         "title": "Elden Ring İncelemesi2",
//         "slug": "elden-ring-incelemesi2",
//         "excerpt": "Elden Ring oyununa detaylı bir bakış.2",
//         "content": "Elden Ring oyununun dünyasını ve oynanış mekaniklerini inceliyoruz.",
//         "cover_image_url": "https://example.com/elden-ring.jpg",
//         "status": "published",
//         "views": 0,
//         "is_featured": false,
//         "author_id": 2,
//         "category_id": 1,
//         "published_at": "2026-10-11T10:56:14.258Z",
//         "created_at": "2026-10-11T10:56:14.258Z",
//         "updated_at": "2026-10-11T10:56:14.258Z",
//         "author_name": "GameBlog Admin",
//         "category_name": "RPG Oyunları - Deneme Kategorisi",
//         "category_slug": "rpg-oyunlari-deneme-kategorisi",
//         "tags": [
//             {
//                 "id": 2,
//                 "name": "BJK",
//                 "slug": "bjk"
//             },
//             {
//                 "id": 1,
//                 "name": "BJK2",
//                 "slug": "bjk2"
//             }
//         ]
//     }
// }




// POST YAZISI PAYLAŞMAK İÇİN GEREKLİ BİLGİLER
// {
//   "title": "Elden Ring İncelemesi2",
//   "excerpt": "Elden Ring oyununa detaylı bir bakış.2",
//   "content": "Elden Ring oyununun dünyasını ve oynanış mekaniklerini inceliyoruz.",
//   "coverImageUrl": "https://example.com/elden-ring.jpg",
//   "status": "published",
//   "isFeatured": false,
//   "categoryId": 1,
//   "tagIds": [1, 2]
// }
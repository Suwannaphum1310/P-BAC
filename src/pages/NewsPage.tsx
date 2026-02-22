import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';
import NewsCard from '@/components/NewsCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

const NewsPage = () => {
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const { data } = await supabase
                    .from('news')
                    .select('*')
                    .eq('is_published', true)
                    .order('created_at', { ascending: false });

                if (data) {
                    setNews(data.map(n => ({
                        id: n.id,
                        image: n.image_url || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
                        date: new Date(n.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
                        title: n.title,
                        excerpt: n.content,
                        category: n.category,
                        facebook_embed: (n as any).facebook_embed,
                    })));
                }
            } catch (error) {
                console.error('Error fetching news:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchNews();
    }, []);

    return (
        <div className="min-h-screen">
            <Header />
            <main className="pt-24 pb-16">
                {/* Hero */}
                <section className="bg-primary text-primary-foreground py-16">
                    <div className="container text-center">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">ข่าวสารและกิจกรรม</h1>
                        <p className="opacity-80 max-w-2xl mx-auto">
                            ติดตามข่าวสารประชาสัมพันธ์ กิจกรรม และความเคลื่อนไหวของวิทยาลัยเทคโนโลยีภูเวียงบัณฑิต
                        </p>
                    </div>
                </section>

                {/* Back Button */}
                <div className="container py-6">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={18} />
                        กลับหน้าหลัก
                    </Link>
                </div>

                {/* News Grid */}
                <section className="container">
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : news.length === 0 ? (
                        <div className="text-center py-24 text-muted-foreground">
                            ยังไม่มีข่าวสารในขณะนี้
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {news.map((item, index) => (
                                <NewsCard key={index} {...item} delay={index * 50} />
                            ))}
                        </div>
                    )}
                </section>
            </main>
            <Footer />
            <BackToTop />
        </div>
    );
};

export default NewsPage;

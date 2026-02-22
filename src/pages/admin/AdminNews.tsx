import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Newspaper, Plus, Search, Edit, Trash2, Loader2, ImagePlus, X as XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { notifyNewAnnouncement } from '@/utils/notifications';

interface News {
    id: string;
    title: string;
    content: string;
    image_url: string | null;
    category: string | null;
    is_published: boolean;
    created_at: string;
}

const AdminNews = () => {
    const { toast } = useToast();
    const [newsList, setNewsList] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState<News | null>(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: '',
        image_url: '',
        facebook_embed: '',
        is_published: true,
    });

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNewsList(data || []);
        } catch (error) {
            console.error('Error fetching news:', error);
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถโหลดข้อมูลข่าวสารได้",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (news?: News) => {
        if (news) {
            setSelectedNews(news);
            setFormData({
                title: news.title,
                content: news.content,
                category: news.category || '',
                image_url: news.image_url || '',
                facebook_embed: (news as any).facebook_embed || '',
                is_published: news.is_published,
            });
        } else {
            setSelectedNews(null);
            setFormData({
                title: '',
                content: '',
                category: '',
                image_url: '',
                facebook_embed: '',
                is_published: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast({
                title: "ข้อมูลไม่ครบ",
                description: "กรุณากรอกหัวข้อและเนื้อหาข่าว",
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            const newsData = {
                title: formData.title.trim(),
                content: formData.content.trim(),
                category: formData.category.trim() || null,
                image_url: formData.image_url.trim() || null,
                facebook_embed: formData.facebook_embed.trim() || null,
                is_published: formData.is_published,
            };

            if (selectedNews) {
                const { error } = await (supabase as any)
                    .from('news')
                    .update(newsData)
                    .eq('id', selectedNews.id);
                if (error) throw error;
                toast({ title: "บันทึกสำเร็จ", description: "อัปเดตข่าวสารเรียบร้อยแล้ว" });
            } else {
                const { data, error } = await (supabase as any).from('news').insert([newsData]).select().single();
                if (error) throw error;
                toast({ title: "เพิ่มสำเร็จ", description: "เพิ่มข่าวสารใหม่เรียบร้อยแล้ว" });

                // Send notification to all students and teachers if published
                if (newsData.is_published) {
                    notifyNewAnnouncement(newsData.title, data?.id);
                }
            }

            setIsModalOpen(false);
            fetchNews();
        } catch (error: any) {
            console.error('Error saving news:', error);
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกข้อมูลได้",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedNews) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('news').delete().eq('id', selectedNews.id);
            if (error) throw error;
            toast({ title: "ลบสำเร็จ", description: "ลบข้อมูลข่าวสารเรียบร้อยแล้ว" });
            setIsDeleteDialogOpen(false);
            setSelectedNews(null);
            fetchNews();
        } catch (error) {
            console.error('Error deleting news:', error);
            toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถลบข้อมูลได้", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const filteredNews = newsList.filter(n =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Newspaper className="text-primary" size={28} />
                    <h1 className="text-2xl font-semibold text-foreground">จัดการข่าวประกาศ</h1>
                </div>
                <Button onClick={() => handleOpenModal()} className="gap-2">
                    <Plus size={18} />
                    เพิ่มข่าวประกาศ
                </Button>
            </div>

            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                    placeholder="ค้นหาข่าวประกาศ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-background rounded-xl border border-dashed border-border text-muted-foreground">
                        {searchTerm ? 'ไม่พบข้อมูลข่าวสารที่ค้นหา' : 'ยังไม่มีข้อมูลข่าวสาร'}
                    </div>
                ) : (
                    filteredNews.map((news) => (
                        <div key={news.id} className="bg-background rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
                            {news.image_url && (
                                <div className="h-40 overflow-hidden">
                                    <img src={news.image_url} alt={news.title} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="p-4 flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                                        {news.category || 'ทั่วไป'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(news.created_at).toLocaleDateString('th-TH')}
                                    </span>
                                </div>
                                <h3 className="font-semibold text-lg mb-2 line-clamp-1">{news.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{news.content}</p>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                                    <span className={`text-xs ${news.is_published ? 'text-green-600' : 'text-amber-600'}`}>
                                        {news.is_published ? '● เผยแพร่แล้ว' : '● ฉบับร่าง'}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(news)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                            <Edit size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedNews(news); setIsDeleteDialogOpen(true); }} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedNews ? 'แก้ไขข่าวประกาศ' : 'เพิ่มข่าวประกาศใหม่'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">หัวข้อข่าว *</Label>
                                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="ใส่หัวข้อข่าวที่นี่" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">หมวดหมู่</Label>
                                <Input id="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="เช่น กิจกรรม, วิชาการ" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>รูปภาพหน้าปก</Label>
                            {formData.image_url ? (
                                <div className="relative inline-block">
                                    <img
                                        src={formData.image_url}
                                        alt="Preview"
                                        className="h-32 w-auto rounded-lg border object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, image_url: '' })}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <XIcon size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <label className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                if (file.size > 5 * 1024 * 1024) {
                                                    toast({ title: 'ไฟล์ใหญ่เกินไป', description: 'กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB', variant: 'destructive' });
                                                    return;
                                                }
                                                setUploading(true);
                                                try {
                                                    const fileExt = file.name.split('.').pop();
                                                    const fileName = `news/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                                                    const { error } = await supabase.storage.from('applications').upload(fileName, file);
                                                    if (error) throw error;
                                                    const { data: { publicUrl } } = supabase.storage.from('applications').getPublicUrl(fileName);
                                                    setFormData({ ...formData, image_url: publicUrl });
                                                    toast({ title: 'อัปโหลดสำเร็จ', description: 'รูปภาพพร้อมใช้งานแล้ว' });
                                                } catch (error: any) {
                                                    console.error('Upload error:', error);
                                                    toast({ title: 'อัปโหลดไม่สำเร็จ', description: error.message, variant: 'destructive' });
                                                } finally {
                                                    setUploading(false);
                                                }
                                            }}
                                        />
                                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-primary hover:bg-muted/50 cursor-pointer transition-colors">
                                            {uploading ? (
                                                <Loader2 className="animate-spin" size={20} />
                                            ) : (
                                                <ImagePlus size={20} className="text-muted-foreground" />
                                            )}
                                            <span className="text-sm text-muted-foreground">
                                                {uploading ? 'กำลังอัปโหลด...' : 'คลิกเพื่อเลือกรูปภาพ'}
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            )}
                            <p className="text-xs text-muted-foreground">รองรับไฟล์ JPG, PNG ขนาดไม่เกิน 5MB</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="content">เนื้อหาข่าว *</Label>
                            <Textarea id="content" value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="รายละเอียดข่าว..." className="min-h-[150px]" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="facebook_embed">
                                Facebook Embed Code
                                <span className="text-xs text-muted-foreground ml-2">(ไม่จำเป็น)</span>
                            </Label>
                            <Textarea
                                id="facebook_embed"
                                value={formData.facebook_embed}
                                onChange={(e) => setFormData({ ...formData, facebook_embed: e.target.value })}
                                placeholder='วาง Embed Code จาก Facebook ที่นี่ เช่น <iframe src="https://www.facebook.com/plugins/post.php?..." ...'
                                className="min-h-[80px] font-mono text-xs"
                            />
                            <p className="text-xs text-muted-foreground">
                                วิธีใช้: ไปที่โพสต์ Facebook → กด ⋯ → Embed → Copy code แล้ววางที่นี่
                            </p>
                            {formData.facebook_embed && (
                                <p className="text-xs text-green-600">✓ วางโค้ดแล้ว (จะแสดงเมื่อบันทึก)</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_published"
                                checked={formData.is_published}
                                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="is_published" className="cursor-pointer">เผยแพร่ข่าวนี้ทันที</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>ยกเลิก</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {selectedNews ? 'บันทึกการแก้ไข' : 'เพิ่มข่าวประกาศ'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>ยืนยันการลบ</DialogTitle>
                    </DialogHeader>
                    <p className="text-muted-foreground">คุณต้องการลบข่าวประกาศ "{selectedNews?.title}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>ยกเลิก</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            ลบข่าวประกาศ
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
};

export default AdminNews;

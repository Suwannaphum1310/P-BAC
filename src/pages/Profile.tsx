import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AdminLayout from '@/components/AdminLayout';
import StudentLayout from '@/components/StudentLayout';
import TeacherLayout from '@/components/TeacherLayout';
import { Camera, Save, Loader2, ArrowLeft, Crop, X, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

// Helper function to create cropped image
function getCroppedImg(image: HTMLImageElement, crop: CropType): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const pixelRatio = window.devicePixelRatio || 1;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    // Use a fixed output size for the avatar (e.g., 256x256)
    const outputSize = 256;
    canvas.width = outputSize * pixelRatio;
    canvas.height = outputSize * pixelRatio;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    // Calculate source coordinates from the crop
    const sourceX = crop.x! * scaleX;
    const sourceY = crop.y! * scaleY;
    const sourceWidth = crop.width! * scaleX;
    const sourceHeight = crop.height! * scaleY;

    ctx.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputSize,
        outputSize
    );

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, 'image/jpeg', 0.95);
    });
}

// Helper to create initial centered crop
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

const ProfilePageContent = () => {
    const navigate = useNavigate();
    const { profile, user, role, updateProfile, uploadAvatar } = useAuth();
    const { toast } = useToast();
    const imgRef = useRef<HTMLImageElement>(null);
    const [studentName, setStudentName] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        position: '',
        email: '',
        phone: '',
    });
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    // Crop states
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [crop, setCrop] = useState<CropType>();
    const [completedCrop, setCompletedCrop] = useState<CropType>();
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [scale, setScale] = useState(1);
    const [rotate, setRotate] = useState(0);

    useEffect(() => {
        // Fetch student name from students table for student role
        const fetchStudentName = async () => {
            if (role === 'student' && user?.email) {
                try {
                    const { data } = await supabase
                        .from('students')
                        .select('first_name, last_name')
                        .eq('email', user.email)
                        .maybeSingle();
                    if (data) {
                        setStudentName(`${data.first_name} ${data.last_name}`);
                    }
                } catch (err) {
                    console.error('Error fetching student name:', err);
                }
            }
        };
        fetchStudentName();
    }, [user, role]);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: studentName || profile.full_name || '',
                position: profile.position || '',
                email: profile.email || '',
                phone: profile.phone || '',
            });
            setPreviewImage(profile.avatar_url || null);
        }
    }, [profile, studentName]);

    const onSelectFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check if file is GIF - upload directly to preserve animation
            if (file.type === 'image/gif') {
                setIsUploading(true);
                const { url, error } = await uploadAvatar(file);
                setIsUploading(false);

                if (error) {
                    toast({
                        title: "เกิดข้อผิดพลาด",
                        description: "ไม่สามารถอัปโหลดรูปภาพได้",
                        variant: "destructive",
                    });
                } else if (url) {
                    setPreviewImage(url);
                    toast({
                        title: "อัปโหลดสำเร็จ",
                        description: "รูปโปรไฟล์ GIF ถูกอัปเดตแล้ว (รักษา Animation)",
                    });
                }
            } else {
                // For other image types, show crop modal
                setOriginalFile(file);
                const reader = new FileReader();
                reader.addEventListener('load', () => {
                    setImageSrc(reader.result?.toString() || '');
                    setCropModalOpen(true);
                });
                reader.readAsDataURL(file);
            }
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    };

    const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1));
    }, []);

    const handleCropComplete = async () => {
        if (!completedCrop || !imgRef.current) return;

        setIsUploading(true);
        setCropModalOpen(false);

        try {
            const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
            const croppedFile = new File([croppedBlob], originalFile?.name || 'avatar.jpg', {
                type: 'image/jpeg'
            });

            const { url, error } = await uploadAvatar(croppedFile);

            if (error) {
                toast({
                    title: "เกิดข้อผิดพลาด",
                    description: "ไม่สามารถอัปโหลดรูปภาพได้",
                    variant: "destructive",
                });
            } else if (url) {
                setPreviewImage(url);
                toast({
                    title: "อัปโหลดสำเร็จ",
                    description: "รูปโปรไฟล์ถูกอัปเดตแล้ว",
                });
            }
        } catch (err) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถตัดรูปภาพได้",
                variant: "destructive",
            });
        }

        setIsUploading(false);
        resetCropState();
    };

    const resetCropState = () => {
        setImageSrc('');
        setCrop(undefined);
        setCompletedCrop(undefined);
        setOriginalFile(null);
        setScale(1);
        setRotate(0);
    };

    const handleCancelCrop = () => {
        setCropModalOpen(false);
        resetCropState();
    };

    const handleSaveClick = () => {
        setConfirmDialogOpen(true);
    };

    const handleConfirmSave = async () => {
        setConfirmDialogOpen(false);
        setIsSaving(true);
        const { error } = await updateProfile({
            full_name: formData.full_name,
            position: formData.position,
            email: formData.email,
            phone: formData.phone,
        });

        // Also update students table if user is a student
        if (!error && role === 'student' && user?.email) {
            const nameParts = formData.full_name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const { error: studentError } = await supabase
                .from('students')
                .update({ first_name: firstName, last_name: lastName })
                .eq('email', user.email);

            if (studentError) {
                console.error('Error updating students table:', studentError);
            } else {
                // Update local state so useEffect doesn't revert
                setStudentName(formData.full_name);
                // Notify other components (e.g., StudentLayout header) to refresh
                window.dispatchEvent(new CustomEvent('student-name-updated', {
                    detail: { name: formData.full_name }
                }));
            }
        }

        if (error) {
            toast({
                title: "เกิดข้อผิดพลาด",
                description: "ไม่สามารถบันทึกข้อมูลได้",
                variant: "destructive",
            });
        } else {
            toast({
                title: "บันทึกสำเร็จ",
                description: "อัปเดตข้อมูลโปรไฟล์เรียบร้อยแล้ว",
            });
        }
        setIsSaving(false);
    };

    const displayName = studentName || profile?.full_name || 'ผู้ใช้งาน';
    const initials = displayName
        ? displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : 'U';

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                <span>ย้อนกลับ</span>
            </button>

            <div className="bg-background rounded-2xl shadow-sm border border-border p-8">
                <div className="flex flex-col items-center gap-6 mb-8">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-muted relative">
                            {previewImage ? (
                                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                                    {initials}
                                </div>
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                                </div>
                            )}
                        </div>
                        <label className="absolute bottom-1 right-1 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-primary-dark transition-all group-hover:scale-110">
                            <Camera size={20} />
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                className="hidden"
                                onChange={onSelectFile}
                                disabled={isUploading}
                            />
                        </label>
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
                        <p className="text-muted-foreground">{profile?.email}</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="full_name">ชื่อ-นามสกุล</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="py-6"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="position">ตำแหน่ง / ชั้นปี</Label>
                        <Input
                            id="position"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            className="py-6"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">อีเมล</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="py-6"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="py-6"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <Button
                            onClick={handleSaveClick}
                            className="w-full py-6 text-lg gap-2"
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                            บันทึกการเปลี่ยนแปลง
                        </Button>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>ยืนยันการอัปเดตข้อมูล</AlertDialogTitle>
                        <AlertDialogDescription>
                            คุณยืนยันที่จะอัปเดตข้อมูลโปรไฟล์ของคุณหรือไม่?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmSave}>
                            ยืนยัน
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Image Crop Modal */}
            <Dialog open={cropModalOpen} onOpenChange={setCropModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Crop className="text-primary" size={24} />
                                <h2 className="text-xl font-bold">ตัดรูปโปรไฟล์</h2>
                            </div>
                        </div>

                        <p className="text-sm text-muted-foreground">
                            ลากกรอบเพื่อเลือกส่วนที่ต้องการ
                        </p>

                        {/* Crop Area */}
                        <div className="flex justify-center bg-muted/30 rounded-lg p-4 max-h-[400px] overflow-auto">
                            {imageSrc && (
                                <ReactCrop
                                    crop={crop}
                                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={1}
                                    circularCrop
                                    className="max-h-[350px]"
                                >
                                    <img
                                        ref={imgRef}
                                        src={imageSrc}
                                        alt="Crop"
                                        onLoad={onImageLoad}
                                        style={{
                                            transform: `scale(${scale}) rotate(${rotate}deg)`,
                                            maxHeight: '350px',
                                            width: 'auto',
                                        }}
                                    />
                                </ReactCrop>
                            )}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                                    title="ซูมออก"
                                >
                                    <ZoomOut size={20} />
                                </button>
                                <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
                                <button
                                    onClick={() => setScale(Math.min(3, scale + 0.1))}
                                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                                    title="ซูมเข้า"
                                >
                                    <ZoomIn size={20} />
                                </button>
                            </div>
                            <div className="w-px h-6 bg-border" />
                            <button
                                onClick={() => setRotate((rotate - 90) % 360)}
                                className="p-2 rounded-lg hover:bg-muted transition-colors"
                                title="หมุนซ้าย"
                            >
                                <RotateCcw size={20} />
                            </button>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 justify-end pt-2">
                            <Button
                                variant="outline"
                                onClick={handleCancelCrop}
                                className="gap-2"
                            >
                                <X size={18} />
                                ยกเลิก
                            </Button>
                            <Button
                                onClick={handleCropComplete}
                                className="gap-2"
                                disabled={!completedCrop}
                            >
                                <Check size={18} />
                                ใช้รูปนี้
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const Profile = () => {
    const { role } = useAuth();

    if (role === 'admin') {
        return (
            <AdminLayout title="โปรไฟล์ส่วนตัว">
                <ProfilePageContent />
            </AdminLayout>
        );
    }

    if (role === 'teacher') {
        return (
            <TeacherLayout title="โปรไฟล์ส่วนตัว">
                <ProfilePageContent />
            </TeacherLayout>
        );
    }

    return (
        <StudentLayout title="โปรไฟล์ส่วนตัว">
            <ProfilePageContent />
        </StudentLayout>
    );
};

export default Profile;

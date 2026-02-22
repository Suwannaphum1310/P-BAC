import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface NewsCardProps {
  id?: string;
  image: string;
  date: string;
  title: string;
  excerpt: string;
  delay?: number;
  facebook_embed?: string;
}

const NewsCard = ({ image, date, title, excerpt, delay = 0, facebook_embed }: NewsCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="bg-card rounded-2xl overflow-hidden shadow-md border border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-lg hover:border-secondary"
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          <span className="absolute bottom-4 left-4 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
            {date}
          </span>
        </div>
        <div className="p-6">
          <h4 className="text-lg font-semibold mb-3 line-clamp-2">{title}</h4>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{excerpt}</p>
          <button
            onClick={() => setIsOpen(true)}
            className="text-primary font-semibold flex items-center gap-2 transition-all duration-300 hover:gap-3"
          >
            อ่านเพิ่มเติม <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* News Detail Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image */}
            <div className="rounded-lg overflow-hidden">
              <img src={image} alt={title} className="w-full h-64 object-cover" />
            </div>

            {/* Date */}
            <p className="text-sm text-muted-foreground">📅 {date}</p>

            {/* Content */}
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-line text-foreground">{excerpt}</p>
            </div>

            {/* Facebook Embed */}
            {facebook_embed && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium mb-3">โพสต์จาก Facebook:</p>
                <div
                  className="overflow-hidden rounded-lg"
                  dangerouslySetInnerHTML={{ __html: facebook_embed }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewsCard;

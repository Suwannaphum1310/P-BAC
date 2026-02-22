interface PrivilegeCardProps {
  icon: string;
  title: string;
  description: string;
}

const PrivilegeCard = ({ icon, title, description }: PrivilegeCardProps) => {
  return (
    <div className="p-5 border border-primary-foreground/10 rounded-2xl bg-primary-foreground/5 text-center">
      <i className={`${icon} text-5xl text-secondary mb-5 block`} />
      <h4 className="text-lg font-semibold mb-2">{title}</h4>
      <p className="text-sm opacity-80">{description}</p>
    </div>
  );
};

export default PrivilegeCard;

const Tooltip = ({ children, content, position = 'top' }) => {
    return (
        <div className="relative flex items-center group">
            {children}
            <div className={`absolute ${position === 'top' ? 'bottom-full' : 'top-full'} mb-2 w-max p-2 text-sm text-white bg-gray-800 dark:bg-black rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10`}>
                {content}
            </div>
        </div>
    );
};

export default Tooltip;

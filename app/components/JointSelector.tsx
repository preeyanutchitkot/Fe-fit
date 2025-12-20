
import React, { useState, useRef, useEffect } from "react";

// Standard Joints (Simple)
const SIMPLE_JOINTS = [
    "LEFT_ELBOW", "RIGHT_ELBOW",
    "LEFT_KNEE", "RIGHT_KNEE",
    "LEFT_ANKLE", "RIGHT_ANKLE",
    "LEFT_WRIST", "RIGHT_WRIST",
    "CHIN"
];

// Complex Joints (Ball-and-Socket) with Axes
const COMPLEX_JOINTS = {
    "LEFT_SHOULDER": { label: "L.Shoulder" },
    "RIGHT_SHOULDER": { label: "R.Shoulder" },
    "LEFT_HIP": { label: "L.Hip" },
    "RIGHT_HIP": { label: "R.Hip" }
};

const AXES = [
    { id: "FLEX_EXT", label: "Flexion / Extension" },
    { id: "AB_AD", label: "Abduction / Adduction" },
    { id: "ROT", label: "Rotation (Int/Ext)" },
];

interface JointSelectorProps {
    selectedJoints: string[];
    onChange: (joints: string[]) => void;
}

const JointSelector: React.FC<JointSelectorProps> = ({ selectedJoints, onChange }) => {
    const [activeComplexJoint, setActiveComplexJoint] = useState<string | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setActiveComplexJoint(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleJoint = (joint: string) => {
        // If it's a complex joint, open options
        if (Object.keys(COMPLEX_JOINTS).includes(joint)) {
            setActiveComplexJoint(activeComplexJoint === joint ? null : joint);
            return;
        }

        // Simple joint toggle
        if (selectedJoints.includes(joint)) {
            onChange(selectedJoints.filter(j => j !== joint));
        } else {
            onChange([...selectedJoints, joint]);
        }
    };

    const toggleAxis = (jointBase: string, axisSuffix: string) => {
        const fullJointName = `${jointBase}_${axisSuffix}`;
        if (selectedJoints.includes(fullJointName)) {
            onChange(selectedJoints.filter(j => j !== fullJointName));
        } else {
            onChange([...selectedJoints, fullJointName]);
        }
    };

    const isSelected = (joint: string) => {
        // Simple match
        if (selectedJoints.includes(joint)) return true;
        // Complex match (if any axis is selected)
        if (Object.keys(COMPLEX_JOINTS).includes(joint)) {
            return selectedJoints.some(j => j.startsWith(joint + "_"));
        }
        return false;
    };

    // SVG Coordinates
    const joints: any = {
        "CHIN": { cx: 100, cy: 55, r: 6 },
        "RIGHT_SHOULDER": { cx: 70, cy: 75, r: 8 },
        "LEFT_SHOULDER": { cx: 130, cy: 75, r: 8 },
        "RIGHT_ELBOW": { cx: 50, cy: 110, r: 8 },
        "LEFT_ELBOW": { cx: 150, cy: 110, r: 8 },
        "RIGHT_WRIST": { cx: 40, cy: 150, r: 8 },
        "LEFT_WRIST": { cx: 160, cy: 150, r: 8 },
        "RIGHT_HIP": { cx: 80, cy: 160, r: 8 },
        "LEFT_HIP": { cx: 120, cy: 160, r: 8 },
        "RIGHT_KNEE": { cx: 70, cy: 220, r: 8 },
        "LEFT_KNEE": { cx: 130, cy: 220, r: 8 },
        "RIGHT_ANKLE": { cx: 70, cy: 270, r: 8 },
        "LEFT_ANKLE": { cx: 130, cy: 270, r: 8 },
    };

    const bones = [
        { x1: 100, y1: 75, x2: 100, y2: 160 },
        { x1: 70, y1: 75, x2: 130, y2: 75 },
        { x1: 80, y1: 160, x2: 120, y2: 160 },
        { x1: 70, y1: 75, x2: 50, y2: 110 }, { x1: 50, y1: 110, x2: 40, y2: 150 },
        { x1: 130, y1: 75, x2: 150, y2: 110 }, { x1: 150, y1: 110, x2: 160, y2: 150 },
        { x1: 80, y1: 160, x2: 70, y2: 220 }, { x1: 70, y1: 220, x2: 70, y2: 270 },
        { x1: 120, y1: 160, x2: 130, y2: 220 }, { x1: 130, y1: 220, x2: 130, y2: 270 },
    ];
    const neck = { x1: 100, y1: 60, x2: 100, y2: 75 };

    return (
        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 relative">
            <div className="text-sm font-bold text-gray-700 mb-2">Important Joints</div>
            <div className="text-xs text-gray-500 mb-2 px-4 text-center">
                Click joint to select. For Hips/Shoulders, select specific movement axes.
            </div>

            <div className="relative">
                <svg width="200" height="300" viewBox="0 0 200 300" className="bg-white rounded-lg shadow-sm border border-gray-100">
                    <circle cx="100" cy="40" r="20" className="fill-gray-100 stroke-gray-400 stroke-2" />
                    <line x1={neck.x1} y1={neck.y1} x2={neck.x2} y2={neck.y2} className="stroke-gray-400 stroke-2" />
                    {bones.map((b, i) => (
                        <line key={i} x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} className="stroke-gray-400 stroke-2" />
                    ))}
                    {Object.keys(joints).map((name) => {
                        const active = isSelected(name);
                        const coords = joints[name];
                        return (
                            <g key={name} onClick={() => toggleJoint(name)} className="cursor-pointer group">
                                <circle cx={coords.cx} cy={coords.cy} r={coords.r + 6} className="fill-transparent" />
                                <circle
                                    cx={coords.cx} cy={coords.cy} r={coords.r}
                                    className={`transition-colors duration-200 stroke-2 ${active ? 'fill-orange-500 stroke-orange-600' : 'fill-white stroke-gray-400 group-hover:stroke-gray-600'}`}
                                />
                                <title>{name}</title>
                            </g>
                        );
                    })}
                    <text x="30" y="30" className="text-xs fill-gray-400 font-bold">R</text>
                    <text x="170" y="30" className="text-xs fill-gray-400 font-bold">L</text>
                </svg>

                {/* Popover for Complex Joints */}
                {activeComplexJoint && (
                    <div
                        ref={popoverRef}
                        className="absolute bg-white shadow-xl rounded-xl border border-gray-200 p-3 z-50 w-48 animate-in fade-in zoom-in duration-200"
                        style={{
                            top: joints[activeComplexJoint].cy - 20,
                            left: joints[activeComplexJoint].cx > 100 ? joints[activeComplexJoint].cx - 200 : joints[activeComplexJoint].cx + 20
                        }}
                    >
                        <div className="font-bold text-gray-800 text-sm mb-2 border-b pb-1">
                            {(COMPLEX_JOINTS as any)[activeComplexJoint].label} Axes
                        </div>
                        <div className="flex flex-col gap-1.5">
                            {AXES.map(axis => {
                                const fullKey = `${activeComplexJoint}_${axis.id}`;
                                const isChecked = selectedJoints.includes(fullKey);
                                return (
                                    <label key={axis.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                            type="checkbox"
                                            className="accent-purple-600 w-4 h-4"
                                            checked={isChecked}
                                            onChange={() => toggleAxis(activeComplexJoint, axis.id)}
                                        />
                                        <span className="text-xs text-gray-700">{axis.label}</span>
                                    </label>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-3 text-xs text-gray-400">
                {selectedJoints.length} joints/axes selected
            </div>
        </div>
    );
};

export default JointSelector;

import React from 'react';
import './css/LabelledDropdown.css';

const LabelledDropdown = (props) => {
    const {
        label,
        options,
        optionsDisplay,
        setSelected,
    } = props;

    return (
        <div className={"dropdown"}>
            <div className={"label"}>
                {label}
            </div>
            <select
                className={"select"}
                onChange={(e) => {setSelected(e.target.value)}}
            >
                {options.map((opt, idx) => (
                    <option
                        value={opt}
                        key={idx}
                    >
                        {optionsDisplay[idx]}
                    </option>
                ))}
            </select>
        </div>
    )
};

export default LabelledDropdown;